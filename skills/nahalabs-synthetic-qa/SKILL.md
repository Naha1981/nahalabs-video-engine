---
name: nahalabs-synthetic-qa
description: QA architecture for any NahaLabs app — Playwright E2E/API/visual/responsive/accessibility/reliability testing plus optional MatrAIx synthetic personas. Prove the product works as a real user, add regression tests for every bug, never weaken a test to make it pass.
---

# NahaLabs Universal QA Skill

## Philosophy

`TEST → OBSERVE → REPRODUCE → ISOLATE → FIX MINIMALLY → REGRESSION TEST → VERIFY`.
Never `TEST → WEAKEN TEST → PASS`. A green suite is not production readiness — it is evidence.
Do not rewrite working architecture just to make it testable; QA is **additive**.

## 1. Immutable baseline first

Inspect repo, branch, latest passing checkpoint, worklog, existing tests, frontend/backend/db/auth/CI.
Create/verify a Git checkpoint before QA. Never destroy a working baseline to accommodate testing.

## 2. Layers (don't collapse them)

- **Unit (Vitest)** — does this function behave correctly?
- **Integration/API** — do components/endpoints work together? (auth, validation, errors, data integrity)
- **E2E (Playwright, default web)** — can a real user complete the journey? Test clicks/typing/nav/
  refresh/back/retry/interruption. Monitor console errors, failed requests, hydration errors.
- **Visual** — baseline screenshots for critical screens; classify diffs as EXPECTED vs REGRESSION.
- **Responsive** — desktop/tablet/390px/360px; no overflow/overlap; usable forms and touch targets.
- **Mobile (Maestro, only if a native app exists)** — real flows, real permissions; a viewport is not a phone.
- **Accessibility** — keyboard, focus, semantics, contrast, error announcements, reduced motion.
- **Security/data isolation** — test the negative: Tenant A **must not** read Tenant B; unauthorized
  API calls must be denied. Test from the API, not only the UI.
- **Failure/network** — slow, timeout, offline, dependency down, retry; no infinite "Loading…".

## 3. Golden path

Create one canonical `golden-path` E2E test for the most important journey:
`open → authenticate → dashboard → primary resource → core action → processing → result →
interaction → persistence → refresh → state still correct`.

## 4. Regression & state machines

Every genuine bug becomes a **permanent regression test**. Test important state transitions
(`initial → loading → ready → processing → success`; `error → retry → success`) and interruptions
(refresh, close/reopen, duplicate submit, timeout).

## 5. External services & AI

Mock external providers for deterministic CI, then run clearly-labelled **real** integration tests.
For AI features, assert the deterministic contract (schema, correct user/resource/tool, fallback,
timeout, malformed output) — an LLM "looks good" is never the sole authority.

## 6. Synthetic personas (MatrAIx) — optional addition

Strictly isolated under `/synthetic-testing` (`personas / scenarios / tasks / reports / evidence /
regression`). Runs against localhost/staging only. Gate: run deterministic tests first; abort if red.
Issue → deterministic evidence → cluster duplicates (40 personas hitting one button = ONE bug, rate 1.0) →
auto-generate a Playwright/Vitest regression that fails now and passes after the fix.
Release gate (100 personas): Critical = 0 · High-severity < 2% · primary-task success ≥ 95% ·
all generated regressions pass.

## 7. Reporting

- Docs: `QA-STRATEGY.md · QA-COVERAGE-MATRIX.md · QA-FAILURE-POLICY.md · QA-WORKLOG.md`.
- Failure report: `TEST · STATUS · SEVERITY(P0-P4) · EXPECTED · ACTUAL · REPRODUCTION · ENVIRONMENT ·
  EVIDENCE · ROOT CAUSE · FIX · REGRESSION TEST · REMAINING RISK`. P0/P1 block release.
- Final report states what is **still unverified** (real device, real payments, physical QR pairing) —
  never claim a real-device test that didn't happen. Release recommendation:
  `NOT READY / CONDITIONALLY READY / READY FOR PILOT / PRODUCTION READY`.
