# NahaLabs Growth OS — Integration Audit (Phase 0)

**Status:** Complete for the first integration milestone.
**Date:** 2026-09-03
**Scope:** Audit of the existing NahaLabs Video Engine before layering Growth OS on top, per the master integration prompt §0.

> Rule followed: **audit first, extend rather than replace, never delete working functionality, never fake a capability.**

---

## 1. Current architecture (as found)

The repository is a **Next.js 15 (App Router) + React 19 + TypeScript** application with no external database and zero required environment variables. It builds and runs self-contained.

| Layer | Location | State |
|---|---|---|
| Production orchestrator | `src/lib/engine/pipeline-orchestrator.ts` | Working. 5-funnel-scene commercial generator (`generateCommercialVideoProject`). |
| Industry intelligence | `src/lib/engine/industry-intelligence.ts` | Working. 12 vertical playbooks (`INDUSTRY_CATALOG`) with hooks, pacing, stock tags. |
| Brand Brain | `src/lib/engine/brand-brain-store.ts` | Working. Voice, colors, compliance blacklist, personas. In-memory. |
| Pre-compose validation | `src/lib/engine/precompose-validator.ts` | Working. WPM pacing, compliance, margins. |
| Post-render review | `src/lib/engine/post-render-reviewer.ts` | Working. 6-criterion scoring rubric. |
| Realism engine | `src/lib/engine/realism-engine.ts` | Working. Prompt enrichment + negative prompts. |
| Subtitle engine | `src/lib/engine/subtitle-engine.ts` | Working. Word cues, SRT/VTT export. |
| Cost governor | `src/lib/engine/cost-governor.ts` | Working. Token/render cost model + agency benchmark. |
| In-memory store | `src/lib/store/video-store.ts` | Working. Module-level seed projects/ledger/intent signals. |
| MCP gateway | `src/lib/integrations/mcp-server.ts` | Working. JSON-RPC tools. |
| HMAC security | `src/lib/integrations/hmac-security.ts` | Working. Fail-closed webhook verification. |
| Integrations | `activepieces-client`, `resend-email` | Working adapters (email/automation). |
| API routes | `src/app/api/*` | Projects, render, brand-brain, billing, telemetry, webhooks, health. |
| Dashboard pages | `src/app/*` | Overview, Studio, Brand Brain, Industry Intel, Pipelines, Approvals, Telemetry, Billing, System Health, Integrations. |
| Tests | `src/tests/**` | Vitest, 10 tests (cost, HMAC, precompose, post-review, subtitles, MCP). |

### What is genuinely real vs. honest-degraded today
- **Real:** deterministic project/script/scene planning, pre-compose QC, post-render review rubric, cost model, HMAC verification, subtitle export, industry playbooks, brand compliance.
- **Honest-degraded (mocked/self-contained, clearly so):** actual frame rendering, cloud generation, TTS, stock search, publishing, analytics. The app "builds with zero env vars and falls back safely" — it does **not** claim a render that did not happen (the render route produces a `/exports/...` path as a placeholder storyboard output). This aligns with the "no fake features" rule once surfaced honestly; Growth OS makes the availability explicit via the provider registry.

---

## 2. Growth OS capabilities that were missing

The Video Engine starts from *"make a video about my business"*. Growth OS requires the layer **above** that — the autonomous growth loop:

| Capability (spec §) | Before | Now |
|---|---|---|
| Multi-tenant orgs/users/roles (§45) | `tenantId` strings only | `src/lib/growth/tenant-store.ts` — database-layer isolation boundary |
| Business understanding from free text (§4) | None | `business-understanding.ts` (vertical, objective, platform, location, confidence) |
| Industry Packs / growth registry (§5) | 12 video playbooks | `industry-packs.ts` — deep Restaurant/Dental/Retail + standard packs for all verticals |
| Signal engine (§11) | Telemetry/intent only | `signal-engine.ts` — scored signals + booking/covers/sales deviation triggers |
| Research before generation (§7–§10) | None | `research-engine.ts` — honest degraded mode, no fabricated trends/competitor facts |
| Opportunity engine (§12, §13) | None | `opportunity-engine.ts` — scored opportunities, **and "know when NOT to make a video"** |
| Strategy artifact (§14) | Script only | `strategy-engine.ts` — versioned `ContentStrategy` + decision log |
| Campaign intake + state machine (§3, §25) | Project DRAFT→ready | `campaigns.ts` — DRAFT…PUBLISHED, checkpoints, approval actions |
| Autopilot, default OFF (§26) | None | per-platform opt-in gate in `campaigns.ts` / `publishing.ts` |
| Resumable checkpoints (§41) | None | `CHECKPOINT_ORDER` + `resumeFromCheckpoint` |
| Failure recovery (§56) | None | `recordFailure` + resume; retryable vs blocked publication states |
| Provider abstraction/availability (§22, §57) | Scattered env assumptions | `providers.ts` — 12 providers, honest `configured/unconfigured`, fallback notes |
| Cost Guard + Usage Ledger + cost-to-serve (§23,§24,§49) | Project cost estimate only | `usage-ledger.ts` — FREE_ONLY enforcement, ledger, 3 tiers, modeled cost-to-serve with flagged least-certain assumption |
| Publishing abstraction + OAuth (§29,§30) | None | `publishing.ts` — OAuth-only, `download_only` honest fallback |
| Metrics normalization + learning (§31–§34) | Intent scoring | `performance-learning.ts` — measured-only learnings, attribution classification |
| Closed-loop orchestration (§2) | None | `growth-loop.ts` — intelligence → production → publish → measure → learn |
| Growth dashboard (§28) | None | `src/app/growth/page.tsx` + nav |
| Growth API surface (§58) | None | `src/app/api/growth/*` (9 route modules) |

---

## 3. Proposed architecture

Growth OS is a **new subsystem that calls the Video Engine**; it does not replace it.

```
BUSINESS OWNER (one message)
        │
        ▼
┌─────────────────────────── GROWTH OS (src/lib/growth) ───────────────────────────┐
│ Business Understanding → Brand/Business Memory (tenant-store)                     │
│ Signal Engine → Research Engine (research-first, honest degradation)              │
│ Opportunity Engine (scores; can choose NON-video)                                 │
│ Campaign state machine + checkpoints + approval (human default)                   │
│ Strategy Engine (versioned) + Decision Log                                        │
│ Cost Guard (FREE_ONLY…) + Usage Ledger + cost-to-serve                            │
│ Publishing abstraction (OAuth; download-only fallback)                            │
│ Performance normalization + Learning (measured data only)                         │
│ Growth Loop orchestrator (growth-loop.ts)                                         │
└───────────────────────────────┬──────────────────────────────────────────────────┘
                                 │ video formats only (reel/16x9/1x1)
                                 ▼
┌─────────────────────────── VIDEO ENGINE (src/lib/engine — unchanged) ─────────────┐
│ Industry Intelligence · Brand Brain · Director/pipeline-orchestrator              │
│ Asset hierarchy · Realism · Pre-compose QC · render · Post-render review          │
│ Subtitles (SRT/VTT) · Cost governor                                               │
└───────────────────────────────────────────────────────────────────────────────────┘
```

### Integration boundaries
- Growth OS imports Video Engine **types and functions**, never mutates them.
- The handoff point: `runProductionAndPublish()` advances production checkpoints and treats the Video Engine `/api/render` (pre-compose + post-render QC) as the rendering authority.
- The Video Engine's `INDUSTRY_CATALOG` remains the production-playbook source; Growth `industry-packs.ts` adds growth/research/compliance intelligence and maps `BusinessVertical → IndustryId`.

---

## 4. Migration requirements

1. **Persistence (currently in-memory).** Both `video-store.ts` and `growth/tenant-store.ts` use module-level storage. The accessor API in `tenant-store.ts` (`insert/update/findById/listAll` scoped by `tenantId`) is deliberately shaped to be swapped for a **Prisma + Postgres** adapter behind the same signatures. Database-level tenant isolation is already enforced in the accessor (every read/write requires `tenantId`; unknown tenants throw/fail-closed).
2. **Real providers.** Wire env-bound adapters: research/LLM (`ANTHROPIC_API_KEY`/`RESEARCH_API_KEY`), stock (`PEXELS_API_KEY`), TTS, generation (`FAL_KEY`/`VIDEO_GEN_API_KEY`), renderer (`RENDERER_ENDPOINT`), Meta OAuth (`META_OAUTH_TOKEN`). Until set, each honestly reports `unconfigured`.
3. **Async jobs.** The state machine + checkpoints are ready for a real worker queue (campaign production/render/publish are long-running).
4. **Auth.** Replace the demo owner with real authentication; roles already exist on `User`.

## 5. Risks
- **AGPL exposure** from OpenMontage — see `OPENMONTAGE_LICENSE_AUDIT.md`. Mitigated: we reimplemented concepts clean-room; no AGPL code vendored.
- **Render reality (§9).** Final server render is honest-degraded until `RENDERER_ENDPOINT`/FFmpeg is wired; pre-compose + post-render QC are real.
- **Cost assumptions (§24).** Cost-to-serve is modeled and flags its least-certain line; it must be replaced by measured ledger data at Pilot Proof.

## 6. Testing requirements (§60) — status
- **Unit:** `src/tests/unit/growth.test.ts` — 29 tests covering business understanding, industry packs, signals, research, opportunities/non-video, campaign state machine, approval/autopilot, checkpoint resume, cost guard, publishing honesty, learning, and an end-to-end loop.
- **Security/tenant isolation:** cross-tenant isolation test + fail-closed unknown-tenant tests.
- **Next:** integration tests against `/api/growth/*`, and a real FFmpeg render path once the renderer endpoint exists.
