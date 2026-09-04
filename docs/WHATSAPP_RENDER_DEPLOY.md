# Deploying the NahaLabs WhatsApp Operator on Render

Step-by-step, from GitHub to a live, self-owned WhatsApp engine.

> One shared Operator serves **all** your apps. Each app just gets its own row in
> `wa_account_bindings` and its own `/api/webhooks/whatsapp` route on the Core side.

---

## 0. What you're deploying

```
WhatsApp (customer) ⇄ Operator (Render, Docker, Baileys) ⇄ Core app (Vercel, Next.js)
                              ▲ 24/7 persistent sockets
```

---

## 1. Prerequisites

- A GitHub repo with this `operator/` folder and `render.yaml` pushed.
- A **PostgreSQL 13+** database. [Neon](https://neon.tech) free tier works —
  grab a `postgresql://...` connection string (with `?sslmode=require`).
- A **Render** account (free tier).

---

## 2. Generate secrets (once)

```bash
# run locally, never commit
node -e "console.log('OPERATOR_API_KEY =', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('WEBHOOK_SECRET  =', require('crypto').randomBytes(32).toString('hex'))"
```

Use the **same two values** in the Operator *and* every Core app that talks to it.

---

## 3. Deploy via Blueprint (recommended)

1. Render → **New** → **Blueprint**.
2. Connect your GitHub repo. Render reads `render.yaml` and finds the service.
3. It prompts for the `sync: false` secrets:
   - `DATABASE_URL`
   - `WEBHOOK_SECRET`
   - `OPERATOR_API_KEY`
4. Click **Apply** → the Operator builds (Docker) and deploys.
5. Copy the URL, e.g. `https://nahalabs-whatsapp-operator.onrender.com`.

### Manual alternative
Render → **New → Web Service** → repo → **Root directory: `operator`** → runtime **Docker** →
**Free** plan → health check `/health` → add the 3 secrets → deploy.

---

## 4. Verify it's alive

```bash
curl https://<your-service>.onrender.com/health
# {"status":"ok","service":"nahalabs-whatsapp-operator",...}

curl https://<your-service>.onrender.com/ready
# {"status":"ok","ready":true,"database":"up"}
```

`/ready` returning `database: up` proves the Operator can reach Postgres.

---

## 5. Keep it awake (Free plan)

Render free instances sleep after ~15 minutes of no traffic. The socket drops when it sleeps.

1. Go to [cron-job.org](https://cron-job.org) → create a job.
2. **URL:** `https://<your-service>.onrender.com/health`
3. **Schedule:** every **10 minutes**.

> Do **not** use a browser timer or a Vercel cron for this. The Operator is stateful;
> it needs an external, always-on scheduler.

---

## 6. Point the Core app at it

In each Core app (`apps/<app>/.env.local` or Vercel project env):

```env
OPERATOR_URL=https://<your-service>.onrender.com
OPERATOR_API_KEY=<same key as above>
WEBHOOK_SECRET=<same secret as above>
```

---

## 7. Activate a business WhatsApp number (owner flow)

1. Create a `wa_account_id` (UUID) in the Operator DB for the business.
2. Add a `wa_account_bindings` row: `(wa_account_id, app_id, tenant_id, webhook_url)`
   where `webhook_url` = `https://<app>.vercel.app/api/webhooks/whatsapp`.
3. In your Core dashboard, the owner clicks **"Connect WhatsApp"** → Core calls:
   `POST /accounts/:id/pair` (Bearer key) → then polls `GET /accounts/:id/qr`.
4. The **owner** scans the pairing QR once with their phone (WhatsApp → Linked Devices).
5. `GET /accounts/:id/status` shows `isConnected: true` + the phone number.
6. The dashboard now shows the **stable customer QR / `wa.me` link**
   (`https://wa.me/<number>?text=...`) — customers scan **that**, not the pairing QR.

---

## 8. End-to-end smoke test

```
Customer texts the number → Operator receives → inbound_delivery created →
signed webhook → Core /api/webhooks/whatsapp verifies HMAC → persists → enqueues job →
AI/business logic → OutboxMessage → dispatcher → POST /send (Bearer key) →
Operator sends via Baileys → customer sees the reply.
```

Confirm at each hop before declaring production readiness:
- Operator log shows the socket `open` and the message `upsert`.
- Core log shows a **verified** webhook + persisted message + queued job.
- `inbound_delivery.status` transitions to `delivered`.
- The customer actually receives the reply.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| :--- | :--- |
| Operator crashes at boot | Missing env var (fails closed) — check `.env.example` |
| `/ready` says `database: down` | Wrong `DATABASE_URL`, IP allow-list, or `sslmode` |
| QR never appears | `POST /accounts/:id/pair` not called, or account already connected |
| QR expired (`410`) | Poll `GET /qr` within `PAIRING_QR_TTL_SECONDS` |
| Session lost after restart | Ensure both `creds` **and** `keys` are persisted in `wa_sessions` |
| No webhook on Core | Check `wa_account_bindings.webhook_url` + `WEBHOOK_SECRET` match |
| Sockets drop overnight | Keep-alive scheduler missing — see §5 |

---

## 10. Post-deploy checklist

- [ ] `/health` + `/ready` return 200
- [ ] cron-job.org keep-alive confirmed (history shows repeated success)
- [ ] secrets match between Operator and Core
- [ ] one real number paired and messages flow end-to-end
- [ ] `STOP`/`UNSUBSCRIBE`/`OPT-OUT` blocklisting wired on the Core
- [ ] pairing QR is not stored anywhere persistent
