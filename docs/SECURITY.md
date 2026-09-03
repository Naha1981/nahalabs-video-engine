# NahaLabs Security & Compliance

**Status:** Baseline engineering controls implemented; items marked **PROD-GATE** must be completed before the 50-Business Ready gate (§46).

## 1. Tenant isolation (§45)
- Every business is an isolated **tenant** (organization). All Growth OS data access goes through `src/lib/growth/tenant-store.ts`, which **requires `tenantId` on every read/write** and throws / returns 404 fail-closed for unknown tenants.
- Cross-tenant access is impossible by construction at the data-access layer (not merely in UI code). Unit test asserts that campaign/signals created in one tenant are invisible to another and that a bogus tenant is rejected.
- **PROD-GATE:** move the in-memory store to Postgres + Prisma with **row-level tenant scoping** (RLS or a mandatory `tenant_id` column + guarded repository), per-record, plus automated cross-tenant access tests in CI.

## 2. Authentication & authorization (§46)
- Users carry roles (`owner/admin/editor/analyst/viewer`) on `User`.
- **PROD-GATE:** real auth (NextAuth/Auth.js or equivalent), hashed credentials (never store passwords), session/JWT with short expiry, role-based route guards on all `/api/growth/*` mutations, and per-role authorization checks before approval/publish/budget actions.

## 3. Secrets & connected accounts (§30)
- Publishing connections are **OAuth only** — NahaLabs never asks for or stores social passwords. `publishing.ts` records scopes, account id, token expiry, and supports revocation.
- OAuth tokens must be stored **server-side, encrypted at rest** (PROD-GATE: KMS/secret manager); secrets are never logged, never sent to the client. No secrets are baked into the build.

## 4. Uploads & media (§46, §5)
- **PROD-GATE:** validate file type (MP4/MOV/JPG/PNG/WebP/PDF/audio) by magic bytes not extension; enforce size limits; scan for malware; serve user media via **signed, expiring URLs**; never execute uploads.

## 5. Safe processing
- FFmpeg must run as a sandboxed, argument-array subprocess (no shell interpolation), with timeouts and resource caps; render jobs run as a least-privilege worker. **PROD-GATE:** a dedicated renderer worker with no access to secrets or other tenants' storage.
- Rate limits on intake, research, generation and publish endpoints (PROD-GATE).

## 6. Prompt injection & data integrity (§42, §46)
- Owner-supplied text is treated as untrusted data: it is classified (`USER_CLAIM`), never echoed as fact, and constrained by Brand Brain compliance blacklists. Research/competitor claims require compliant sources and are never fabricated.
- **PROD-GATE:** structured LLM output validation (zod), tool-call allow-listing, and prompt-injection test cases in CI.

## 7. Audit logging & retention (§46)
- Consequential actions are recorded in an **audit log** (tenant created, user invited, campaign created/approved/rejected, publish, autopilot toggle, connection events). Decision log records system choices with evidence/cost.
- **PROD-GATE:** tamper-evident/append-only audit store; configurable **retention and deletion controls** (right-to-erasure); per-tenant data export.

## 8. POPIA (South Africa) (§46, §7)
- Multi-tenant SaaS processing South African businesses' and their customers' personal information is subject to POPIA. Baseline stance:
  - Personal information is minimized; prospect/competitor research uses **compliant public sources or manual, human-verified, one-at-a-time lookups only** — no bulk scraping or unauthorized surveillance (§47).
  - Authorized business data (bookings/POS) is ingested only with the customer's consent.
  - Data residence default is `ZA` on the organization; region pinning is a PROD-GATE.
- **PROD-GATE (before outreach at scale):** lawful-basis review, consent records, data-subject request workflow (access/delete), processor agreements with all vendors (research, generation, publishing, hosting), and a POPIA sign-off.

## 9. No fake functionality (§14, §50)
- Providers report real availability; unconfigured/blocked capabilities return explicit "unavailable — here's why" / degraded results rather than fake success. The Cost Guard blocks paid execution under `FREE_ONLY`. This keeps the system honest even before every integration is live.

## 10. Secure callbacks
- Webhooks use the existing HMAC v2 scheme (`src/lib/integrations/hmac-security.ts`): fail-closed (401 on missing/invalid signature), constant-time comparison. OAuth publish callbacks must verify state/CSRF and token audience (PROD-GATE: verify on the existing webhook framework).
