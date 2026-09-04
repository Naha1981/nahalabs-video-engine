# NahaLabs WhatsApp Operator

Self-owned, multi-tenant WhatsApp infrastructure (`@whiskeysockets/baileys`). ADR-014.
**No Twilio. No Evolution API. No 360dialog. No paid Cloud API.**

This is the **Engine**. It holds 24/7 WebSocket connections to WhatsApp and talks to the
**Core** (your Next.js app on Vercel) exclusively over HMAC-v2-signed HTTP.

> The Core-side contract lives in
> [`../skills/nahalabs-whatsapp-operator`](../skills/nahalabs-whatsapp-operator) —
> see `SKILL.md` and `references/whatsapp-operator-contract.md`.

---

## Quick start (local)

```bash
cd operator
cp .env.example .env          # fill DATABASE_URL, WEBHOOK_SECRET, OPERATOR_API_KEY
npm install
npm run dev                   # starts on :10000
```

```bash
curl http://localhost:10000/health
# {"status":"ok","service":"nahalabs-whatsapp-operator",...}
```

Pair an account and watch for the QR (also printed in the terminal):

```bash
curl -X POST http://localhost:10000/accounts/<wa_account_id>/pair \
  -H "Authorization: Bearer $OPERATOR_API_KEY"

curl http://localhost:10000/accounts/<wa_account_id>/qr \
  -H "Authorization: Bearer $OPERATOR_API_KEY"
```

---

## Deploy to Render

### Option A — Blueprint (recommended, one click)
1. Push this repo to GitHub.
2. Render → **New → Blueprint** → select the repo. Render reads [`../render.yaml`](../render.yaml).
3. Enter the 3 secrets when prompted: `DATABASE_URL`, `WEBHOOK_SECRET`, `OPERATOR_API_KEY`.
4. Deploy. Note the service URL (e.g. `https://nahalabs-whatsapp-operator.onrender.com`).

### Option B — Manual
1. Render → **New → Web Service** → connect the repo.
2. Set **Root directory** to `operator`, runtime **Docker**, plan **Free**.
3. Health check path: `/health`.
4. Add the env vars from `.env.example` (all three secrets required).
5. Deploy, then copy the service URL.

### Keep-alive (Free plan sleeps after ~15 min of no traffic)
1. Create a **cron-job.org** job:
   - URL: `https://<your-service>.onrender.com/health`
   - Schedule: **every 10 minutes**.
2. That's it — never use a browser timer, and never add `cron` to `vercel.json`.

### Point your Core app at it
In the Core app's `.env.local`:
```
OPERATOR_URL=https://<your-service>.onrender.com
OPERATOR_API_KEY=<same key>
WEBHOOK_SECRET=<same secret>
```

---

## API surface

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | none | liveness (keep-alive) |
| `GET` | `/ready` | none | readiness (DB reachable) |
| `POST` | `/accounts/:id/pair` | Bearer key | start socket + QR pairing |
| `GET` | `/accounts/:id/qr` | Bearer key | current ephemeral pairing QR |
| `GET` | `/accounts/:id/status` | Bearer key | connection status + phone number |
| `POST` | `/accounts/:id/disconnect` | Bearer key | graceful logout |
| `POST` | `/send` | Bearer key | send a message (idempotency at Core outbox) |

Inbound messages are pushed **by the Operator** to each binding's `webhook_url` (from
`wa_account_bindings`) with `X-Signature` / `X-Timestamp` / `X-Nonce` headers.

---

## Security invariants

- Fail closed: missing config aborts startup; missing/invalid API key ⇒ 401; invalid signature ⇒ reject.
- Ephemeral pairing QRs live in memory with a TTL and are **never** persisted to Postgres.
- Sessions persist both **creds and signal keys** (so sockets survive restarts).
- **INV-1:** one live socket per `wa_account_id`; bindings fan out idempotently
  (`inbound_delivery` unique constraint).
