---
name: nahalabs-vercel-deployment
description: Deployment rules for NahaLabs apps on Vercel Free Plan — never use Vercel-native crons, route all scheduled work through cron-job.org + a CRON_SECRET-protected endpoint, keep Render stateful services alive with an external scheduler, and expose health/live/ready endpoints.
---

# NahaLabs Vercel Deployment Skill

## 1. Free-Plan cron rule (mandatory)

- **Never** add `crons`/`cronJobs` to `vercel.json`, `next.config.js`, or any Vercel config — on the
  Free Plan these fail the deployment.
- Implement all scheduled work as normal API routes (`/api/cron/<task>`) with:
  - `POST` (or `GET`) only, protected by `Authorization: Bearer ${CRON_SECRET}` or `?key=${CRON_SECRET}`;
  - a proper JSON response (`{ success: true }`);
  - **idempotent** handlers.
- After writing a route, emit a copy-paste **cron-job.org** block: full production URL, required
  headers (`Authorization: Bearer YOUR_CRON_SECRET`), suggested schedule. Then scan and remove any
  legacy Vercel-native cron config so the build passes on Free.

## 2. Health / live / ready

Expose on every backend:

- `GET /health` — service responding (basic availability, no heavy work).
- `GET /health/live` — process alive.
- `GET /health/ready` — **can it actually do its job?** (critical dependencies reachable).

Standard body: `{ status, service, environment, timestamp, version }`. Validate status/body/time —
an endpoint is not "healthy" merely because it returned *some* HTTP response.

## 3. Render keep-alive (stateful services only)

Render free instances sleep. Keep the WhatsApp Operator (and any stateful worker) awake with an
**external scheduler** hitting `/health` every ≤10 min — never a frontend timer and never a claim
that the browser keeps Render awake. The Operator must handle `SIGTERM` gracefully.

## 4. Build resilience & secrets

- Build must pass with **zero** env vars: DB clients nullable, services guard against null db.
- Secrets only via env vars/secret manager; never in client bundles; never committed.
- If an external service is unreachable at runtime, **log and degrade** — the messaging webhook still
  returns `200 fast` even if the AI enqueue temporarily fails.

## 5. Post-deploy verification

Deploy → verify `/health` + `/ready` → verify cron auth (unauthorized must fail) → configure
cron-job.org → **prove the scheduler runs repeatedly** → connect external services → run one real
end-to-end journey (REAL USER → webhook → auth → DB → AI/business → outbox → worker → delivery →
reconciliation → UI). A green deploy badge is not sufficient.
