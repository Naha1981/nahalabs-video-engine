# Core-side Messaging (the other half of the flow)

Reference implementation of the **Core** side of the NahaLabs Messaging Platform — the half
that runs in your Next.js app on Vercel. The **Operator** side lives in [`../../operator`](../../operator)
and the deploy guide is [`../../docs/WHATSAPP_RENDER_DEPLOY.md`](../../docs/WHATSAPP_RENDER_DEPLOY.md).

## The whole flow (both halves wired)

```
customer ──► Operator (Baileys socket)
               │  1. persists platform_event, resolves bindings, idempotent inbound_delivery
               │  2. POST signed HMAC-v2 webhook
               ▼
            Core /api/webhooks/whatsapp   ← operator/reference-core-webhook.route.ts
               │  3. verify HMAC → validate → persist inbound_message → enqueue platform_job → 200 fast
               ▼
            jobs.ts worker (SKIP LOCKED)  ← runs AI/business logic off-request
               │  4. writes reply to outbox_message
               ▼
            outbox.ts dispatcher (SKIP LOCKED) ← POST /api/cron/dispatch-outbox (cron-job.org)
               │  5. platform-client.send() → Operator /send (Bearer key)
               ▼
            Operator → Baileys → customer receives the reply
```

## Files

| File | Role |
| :--- | :--- |
| `platform-client.ts` | Typed client — the **only** way business code reaches the Operator |
| `outbox.ts` | Outbox dispatcher + backoff + stale-recovery (pure logic, tested) |
| `jobs.ts` | Durable job worker for inbound processing |
| `types.ts` | Shared types + store interfaces |
| `schema.sql` | Core-side tables (`outbox_message`, `platform_job`, `inbound_message`) + claim SQL |
| `outbox-store.pg.ts` | Reference `pg` store (`npm i pg`; map 1:1 to Drizzle in production) |
| `dispatch-route.ts` | The `/api/cron/dispatch-outbox` route (CRON_SECRET-protected) |
| `outbox.test.ts` → `src/tests/unit/messaging-outbox.test.ts` | Unit tests for the pure dispatcher/backoff logic |

## Wiring it into your app

1. Copy these files to `src/lib/messaging/` (and the webhook to `src/app/api/webhooks/whatsapp/route.ts`).
2. `npm i pg` (or implement the `OutboxStore`/`JobStore` interfaces with Drizzle).
3. Set env vars on the Core (Vercel): `OPERATOR_URL`, `OPERATOR_API_KEY`, `WEBHOOK_SECRET`, `CRON_SECRET`.
4. Create the tables from `schema.sql` (Drizzle migration in production).
5. Point **cron-job.org** at `POST /api/cron/dispatch-outbox` with `Authorization: Bearer <CRON_SECRET>`
   every minute (or your desired latency). Add a second job pointing at your inbound worker route.

## Rules honored

- Webhook returns **200 fast**; AI/business logic runs in the worker, never in the request path.
- Outbox is the durable source of truth: `pending → sending → sent | failed(backoff) | dead`.
- Idempotent enqueue via `dedupe_key`; dispatcher never double-sends.
- Business code calls `sendMessage(...)` and never touches Baileys — swap the transport in one file.

## Verify

```bash
# from the repo root (typecheck the pure-TS subset)
npx tsc --noEmit --skipLibCheck --target es2020 --module esnext --moduleResolution bundler \
  --lib es2020,dom reference/core-messaging/types.ts reference/core-messaging/platform-client.ts \
  reference/core-messaging/outbox.ts reference/core-messaging/jobs.ts

# run the dispatcher unit tests
npx vitest run src/tests/unit/messaging-outbox.test.ts
```
