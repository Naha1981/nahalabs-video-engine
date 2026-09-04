# WhatsApp Operator — Reference Contract

> **Reference implementation — adapt and test before production.** This documents the canonical
> data model, HMAC scheme, and a corrected Operator skeleton. It is not a claim of "tested in production."

---

## 1. Database schema (Operator-managed, raw `pg`, auto-created on boot)

```sql
-- Baileys session state: BOTH creds AND signal keys must persist for restart survival.
CREATE TABLE IF NOT EXISTS wa_sessions (
  wa_account_id UUID        NOT NULL,
  key           TEXT        NOT NULL,      -- 'creds' | 'keys'
  value         JSONB       NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (wa_account_id, key)
);

-- Ephemeral pairing QR — never stored in Postgres (memory/Redis TTL only).
-- (No table. Emit qr to the Core via the session/status channel.)

CREATE TABLE IF NOT EXISTS wa_accounts (
  wa_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number  TEXT,
  is_connected  BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Which app+tenant a WhatsApp account serves, and where to forward inbound messages.
CREATE TABLE IF NOT EXISTS wa_account_bindings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_account_id UUID NOT NULL REFERENCES wa_accounts(wa_account_id),
  app_id        TEXT NOT NULL,             -- 'gemino' | 'flavourly' | 'orderly' | ...
  tenant_id     UUID NOT NULL,
  webhook_url   TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wa_account_id, app_id, tenant_id)
);

-- Durable inbound deliveries (idempotent fan-out per binding).
CREATE TABLE IF NOT EXISTS inbound_delivery (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    TEXT NOT NULL,             -- Baileys msg key id (idempotency)
  wa_account_id UUID NOT NULL,
  tenant_id     UUID NOT NULL,
  app_id        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending',  -- pending|delivered|failed
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wa_account_id, tenant_id, app_id, message_id)
);
```

## 2. HMAC v2 scheme (both directions)

```
signature = hex( HMAC-SHA256( secret, `${timestamp}.${nonce}.${rawBody}` ) )
Headers: X-Signature, X-Timestamp, X-Nonce
Verification: recompute with constant-time compare (crypto.timingSafeEqual);
reject if |now - timestamp| > tolerance (e.g. 300s) or nonce seen before.
```

## 3. Operator HTTP surface

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | none | liveness for keep-alive scheduler |
| `POST` | `/accounts/:id/pair` | `OPERATOR_API_KEY` | create socket, begin QR pairing (returns `pairingStarted`) |
| `POST` | `/send` | `OPERATOR_API_KEY` | enqueue outbound message (idempotent) |
| `POST` | `/accounts/:id/disconnect` | `OPERATOR_API_KEY` | graceful logout + state cleanup |

Inbound messages are pushed by the Operator to each binding's `webhook_url` with the HMAC v2 headers.

## 4. Corrected Operator skeleton (reference)

Key fixes vs. the naive version: **persist BOTH `creds` and `keys`** (without keys, sessions do not
survive restarts), resolve bindings and fan out idempotently, sign with HMAC v2, and use real
exponential backoff with socket cleanup.

```ts
// operator/src/whatsapp/index.ts — REFERENCE (adapt + test before production)
import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';
import { saveSession, getSession, updateWaAccount } from '../db/client.js';
import { forwardToCore } from '../webhook/forward.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const sockets = new Map<string, ReturnType<typeof makeWASocket>>();
const pairingQr = new Map<string, string>(); // ephemeral, TTL'd, never persisted

export function sign(payload: string, secret: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${payload}`)
    .digest('hex');
  return { signature, timestamp, nonce };
}

export function verify(payload: string, signature: string, timestamp: string, nonce: string, secret: string) {
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${payload}`)
    .digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// DB-backed state store: persist BOTH creds and keys (BufferJSON-safe via JSONB).
function makeDbAuthState(waAccountId: string) {
  return {
    state: {
      creds: undefined as any,
      keys: {
        get: async (type: string, ids: string[]) => {
          const keys = await getSession(waAccountId, 'keys');
          return Object.fromEntries(ids.map(id => [id, keys?.[`${type}-${id}`]]));
        },
        set: async (data: any) => {
          const keys = await getSession(waAccountId, 'keys') ?? {};
          for (const [k, v] of Object.entries(data)) keys[k] = v;
          await saveSession(waAccountId, 'keys', keys);
        },
      },
    },
    saveCreds: async (creds: any) => { await saveSession(waAccountId, 'creds', creds); },
  };
}

export async function startWhatsAppSocket(waAccountId: string, attempt = 0) {
  if (sockets.has(waAccountId)) return { success: true, alreadyStarted: true };

  const auth = makeDbAuthState(waAccountId);
  const creds = await getSession(waAccountId, 'creds');
  auth.state.creds = creds ?? undefined;

  const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 0] }));
  const sock = makeWASocket({
    version,
    auth: auth.state,
    printQRInTerminal: true,
    browser: ['NahaLabs', 'Chrome', '120.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    logger,
  });
  sockets.set(waAccountId, sock);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { pairingQr.set(waAccountId, qr); await updateWaAccount(waAccountId, { qrAvailable: true, isConnected: false }); }
    if (connection === 'open') {
      pairingQr.delete(waAccountId);
      await updateWaAccount(waAccountId, { isConnected: true, phoneNumber: sock.user?.id?.split(':')[0] ?? null });
      logger.info(`WhatsApp connected: ${waAccountId}`);
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      sockets.delete(waAccountId);
      if (loggedOut) { await updateWaAccount(waAccountId, { isConnected: false }); return; }
      const delay = Math.min(5000 * 2 ** attempt, 5 * 60_000); // exponential backoff, 5m cap
      logger.warn(`Connection closed (code ${code}); reconnecting in ${delay}ms`);
      setTimeout(() => startWhatsAppSocket(waAccountId, attempt + 1), delay);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;           // ignore outbound echoes
    await forwardToCore(waAccountId, msg);                 // resolve bindings + HMAC + idempotent fan-out
  });

  sock.ev.on('creds.update', auth.saveCreds);
  return { success: true };
}

export async function sendMessage(waAccountId: string, to: string, text: string) {
  const sock = sockets.get(waAccountId);
  if (!sock) throw new Error('Socket not initialized or disconnected');
  const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
  return sock.sendMessage(jid, { text });
}
```

## 5. `forwardToCore` — bindings + idempotent fan-out (reference)

```ts
// operator/src/webhook/forward.ts
import { sign } from '../whatsapp/index.js';

export async function forwardToCore(waAccountId: string, msg: any) {
  const bindings = await getBindings(waAccountId); // SELECT ... FROM wa_account_bindings WHERE wa_account_id=$1
  if (!bindings.length) { logger.warn(`No binding for ${waAccountId}`); return; }

  for (const b of bindings) {
    const created = await claimInboundDelivery(b, msg.key.id); // INSERT ... ON CONFLICT DO NOTHING
    if (!created) continue; // already delivered to this binding → idempotent skip
    const payload = JSON.stringify({ waAccountId, tenantId: b.tenant_id, appId: b.app_id, message: msg });
    const { signature, timestamp, nonce } = sign(payload, process.env.WEBHOOK_SECRET!);
    await fetch(b.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature, 'X-Timestamp': timestamp, 'X-Nonce': nonce },
      body: payload,
    });
  }
}
```

## 6. Core-side webhook (reference flow)

`/api/webhooks/whatsapp/route.ts`: read **raw body** → verify HMAC v2 (constant-time, timestamp
tolerance, nonce cache) → Zod-validate payload → resolve `tenantId` **from the operator's signed
payload** (already authoritatively resolved) → persist inbound message → enqueue durable `PlatformJob`
→ return `{ ok: true }` fast. Never do AI work in the webhook request path.
