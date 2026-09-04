import makeWASocket, { DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { getSession, saveSession, updateAccount } from './store.js';
import { forwardToCore } from './forward.js';
import { logger } from './logger.js';

const sockets = new Map(); // waAccountId -> socket (INV-1: ONE live socket per account)
const pairingQr = new Map(); // waAccountId -> { qr, expiresAt } (ephemeral, never persisted)
const manualStops = new Set(); // accounts intentionally disconnected

const qrTtlMs = () => Number(process.env.PAIRING_QR_TTL_SECONDS || 120) * 1000;

/** DB-backed auth state: persists BOTH creds AND signal keys so sessions survive restarts. */
function makeDbAuthState(waAccountId) {
  const state = {
    creds: undefined,
    keys: {
      get: async (type, ids) => {
        const keys = (await getSession(waAccountId, 'keys')) ?? {};
        const out = {};
        for (const id of ids) out[id] = keys[`${type}-${id}`] ?? null;
        return out;
      },
      set: async (data) => {
        const keys = (await getSession(waAccountId, 'keys')) ?? {};
        for (const [k, v] of Object.entries(data)) keys[k] = v;
        await saveSession(waAccountId, 'keys', keys);
      },
    },
  };
  return {
    state,
    saveCreds: async (creds) => { await saveSession(waAccountId, 'creds', creds); },
  };
}

export async function startWhatsAppSocket(waAccountId, attempt = 0) {
  manualStops.delete(waAccountId);
  if (sockets.has(waAccountId)) return { success: true, alreadyStarted: true };

  const auth = makeDbAuthState(waAccountId);
  auth.state.creds = (await getSession(waAccountId, 'creds')) ?? undefined;

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

    if (qr) {
      pairingQr.set(waAccountId, { qr, expiresAt: Date.now() + qrTtlMs() });
      await updateAccount(waAccountId, { is_connected: false }).catch(() => {});
    }

    if (connection === 'open') {
      pairingQr.delete(waAccountId);
      const phoneNumber = sock.user?.id?.split(':')[0] ?? null;
      await updateAccount(waAccountId, { is_connected: true, phone_number: phoneNumber }).catch(() => {});
      logger.info({ waAccountId, phoneNumber }, 'whatsapp connected');
    }

    if (connection === 'close') {
      sockets.delete(waAccountId);
      pairingQr.delete(waAccountId);
      const code = lastDisconnect?.error?.output?.statusCode ?? null;
      const loggedOut = code === DisconnectReason.loggedOut;

      if (loggedOut || manualStops.has(waAccountId)) {
        await updateAccount(waAccountId, { is_connected: false }).catch(() => {});
        logger.info({ waAccountId, code, loggedOut, manual: manualStops.has(waAccountId) }, 'socket closed (no reconnect)');
        return;
      }

      const delay = Math.min(5000 * 2 ** attempt, 5 * 60_000); // exponential backoff, 5m cap
      logger.warn({ waAccountId, code, delay }, 'connection closed; reconnecting');
      setTimeout(() => startWhatsAppSocket(waAccountId, attempt + 1), delay);
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg?.message || msg.key?.fromMe) return; // ignore outbound echoes
    await forwardToCore(waAccountId, msg);
  });

  sock.ev.on('creds.update', auth.saveCreds);

  return { success: true };
}

export async function stopWhatsAppSocket(waAccountId) {
  manualStops.add(waAccountId);
  const sock = sockets.get(waAccountId);
  sockets.delete(waAccountId);
  pairingQr.delete(waAccountId);
  if (sock) {
    try { await sock.logout(); } catch (err) { logger.warn({ err, waAccountId }, 'logout failed'); }
    try { sock.end?.(new Error('manual disconnect')); } catch { /* ignore */ }
  }
  await updateAccount(waAccountId, { is_connected: false }).catch(() => {});
  logger.info({ waAccountId }, 'socket stopped');
}

export async function stopAll() {
  const ids = [...sockets.keys()];
  await Promise.all(ids.map((id) => stopWhatsAppSocket(id)));
}

export async function sendMessage(waAccountId, to, text) {
  const sock = sockets.get(waAccountId);
  if (!sock) throw new Error('Socket not initialized or disconnected');
  const jid = to.includes('@s.whatsapp.net') ? to : `${to}@s.whatsapp.net`;
  return sock.sendMessage(jid, { text });
}

export function isSocketConnected(waAccountId) {
  return sockets.has(waAccountId);
}

export function getPairingQr(waAccountId) {
  const entry = pairingQr.get(waAccountId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    pairingQr.delete(waAccountId);
    return null;
  }
  return entry.qr;
}
