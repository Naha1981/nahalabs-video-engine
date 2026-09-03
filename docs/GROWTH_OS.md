# NahaLabs Growth OS

**NahaLabs is an autonomous intelligent growth & content-production operating system.** The Video Engine is the production engine; Growth OS is the intelligence and opportunity layer above it.

The owner does **not** operate a video editor or a content calendar. They state a business outcome — *"Promote our new burger"* — and NahaLabs decides whether a campaign is warranted, researches it, chooses the right content format (which is **not always video**), produces it, gets approval where required, publishes, measures, and learns.

---

## The closed growth loop

```
BUSINESS MEMORY → SIGNAL DETECTION → RESEARCH → OPPORTUNITY → CAMPAIGN
   → STRATEGY → (Video Engine production) → QC → HUMAN APPROVAL
   → PUBLISH → MEASURE → LEARN → NEXT OPPORTUNITY
```

Implemented in `src/lib/growth/` and orchestrated by `growth-loop.ts`.

## Autonomy vs. human control
The system is autonomous over **execution** but stops for **consequential human decisions**:

- **Autonomous:** understand business, detect industry, research, score opportunities, choose strategy/format, plan scenes, choose assets (real-first), decide generation gaps, produce, captions/audio, QC, repair, platform variants, maintain memory.
- **Human approval (default ON):** major creative direction, material business claims, **any paid generation spend**, final publication, sensitive/compliance decisions, significant brand changes.
- **Autopilot is opt-in, per platform, and always OFF by default** (§26). It only fires when: opted in + campaign policy allows + QC passed + no compliance block + budget permits.

## Core modules

| Module | File | Responsibility |
|---|---|---|
| Types/contracts | `types.ts` | All Growth OS entities & the campaign state machine |
| Multi-tenant store | `tenant-store.ts` | Database-layer tenant isolation, orgs/users/roles, audit log |
| Business understanding | `business-understanding.ts` | Free text → vertical, industry, objective, platform, location, confidence |
| Industry packs | `industry-packs.ts` | Deep Restaurant/Dental/Retail + standard packs for all verticals |
| Signal engine | `signal-engine.ts` | Scored signals; booking/covers/sales deviation triggers |
| Research engine | `research-engine.ts` | Research-first hard rule; honest degraded mode; no fabricated trends |
| Opportunity engine | `opportunity-engine.ts` | Scores opportunities; **decides when video is the wrong format** |
| Strategy engine | `strategy-engine.ts` | Versioned `ContentStrategy` + decision log |
| Campaigns | `campaigns.ts` | Intake normalization, state machine, checkpoints, approval, recovery, autopilot gate |
| Providers | `providers.ts` | 12 provider descriptors, honest availability, Cost Guard |
| Usage ledger | `usage-ledger.ts` | Ledger, FREE_ONLY enforcement, cost-to-serve, 3 pricing tiers |
| Publishing | `publishing.ts` | Unified publisher, OAuth-only, download-only fallback |
| Performance & learning | `performance-learning.ts` | Metric normalization, attribution classification, measured-only learning |
| Growth loop | `growth-loop.ts` | End-to-end orchestration |
| Seed | `seed.ts` | Demo restaurant tenant (booking-dip → opportunity story) |

## Campaign state machine

```
DRAFT → RESEARCHED → STRATEGY_READY → AWAITING_APPROVAL → APPROVED
      → PRODUCTION → QC → READY_TO_PUBLISH → PUBLISHED
      (CHANGES_REQUESTED | REJECTED | FAILED_RECOVERABLE)
```

Checkpoints (`CHECKPOINT_ORDER`): RESEARCH → STRATEGY → SCRIPT → SCENE_PLAN → ASSETS → EDIT → AUDIO → CAPTIONS → RENDER → QC → APPROVAL → PUBLISHED. A failure at stage N resumes from the last checkpoint — **stage 1 is never restarted**.

## Research-first & honesty rules
- **Research precedes generation.** A bare "make a video" is never enough.
- No external research provider? The run is marked `degraded_no_provider` and uses only seasonal/owner-authorized data — **it never fabricates** trends, demand numbers, or competitor moves.
- Competitor intel uses compliant public sources or manual verification only — **no bulk scraping / surveillance** (§10, §47).
- Every fact is classified: `KNOWN_FACT / USER_CLAIM / VERIFIED_SOURCE / CREATIVE_INTERPRETATION / UNKNOWN` (§42). Prices, awards, testimonials, statistics are never invented.
- Providers that are unconfigured report `unconfigured`; the engine **degrades honestly** (real footage, captions-only, download-only) instead of faking success (§57).

## Cost governance (§23, §24, §49)
- Cost modes: `FREE_ONLY · LOWEST_COST · BALANCED · QUALITY_FIRST · MANUAL`. **Default `FREE_ONLY` = absolutely no paid execution.**
- Flow: Eligibility → Cost Guard → Provider → Usage Ledger. Every operation is logged.
- Three pricing tiers carry a **modeled cost-to-serve**; the **least-certain assumption is always flagged** and replaced with measured data as usage accrues.

## Tenancy & security (§45, §46)
- Every business is an isolated **tenant**; isolation is enforced in the data-access layer (`tenantId` required; unknown tenant → fail-closed).
- OAuth-only channel connections (passwords never accepted); per-platform autopilot; audit log for all consequential actions.

## API surface (`/api/growth/*`)
| Route | Methods | Purpose |
|---|---|---|
| `organizations` | GET/POST | List/create tenants (seeds demo on GET) |
| `campaigns` | GET/POST | List / intake + run intelligence |
| `campaigns/[id]` | GET/POST | Detail; actions: approve/request_changes/reject/produce/resume/record_metrics |
| `opportunities` | GET/POST | List / research + evaluate |
| `signals` | GET/POST | Signals + business metrics (booking/covers/sales) |
| `providers` | GET | Honest provider availability |
| `connections` | GET/POST | OAuth connections + autopilot toggle |
| `publications` | GET/POST | Request/execute publishing (download-only fallback) |
| `usage` | GET | Ledger, totals, cost-to-serve, tiers |

## Dashboard
`/growth` — the Growth OS command center: one-message intake, live loop trace, scored opportunities (with non-video recommendations), provider honesty panel, campaigns & approval, channel/autopilot status, and usage/cost-to-serve.

See `ARCHITECTURE.md` for how Growth OS sits over the Video Engine, and the audit/integration docs for open-source provenance.
