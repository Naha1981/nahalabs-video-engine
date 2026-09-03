# NahaLabs Video Engine - Architecture Blueprint

**Version:** 3.0.0-governed  
**Status:** Production Ready · 10/10 Governance Standard

---

## 1. Executive Concept & The OpenMontage Moat

```text
OPENMONTAGE UPSTREAM
Production orchestration · 35mm optical physics · Scene plan decomposition · Pre-compose validation · Post-render self-review
       ↓
NAHALABS VIDEO ENGINE COMMERCIAL LAYER
Business Understanding · Industry Intelligence (12+ Verticals) · Brand Brain Voice Matrix · Multi-Tenancy · Approvals · Usage Metering · ROI Attribution
       ↓
COMMERCIAL OUTPUT
Prospect → Production → Performance
```

### Key Differences
- **OpenMontage:** Starts from *"Make me a video"*.
- **NahaLabs Video Engine:** Starts from *"Tell me about your business, target ICP, and commercial objective"*.

---

## 2. High-Level Architecture Diagram

```
[ Human User / Dashboard ]    [ Claude / Cursor / ChatGPT ]    [ Activepieces / Zapier / Make ]
            │                               │                               │
            │                               ▼                               ▼
            │                        /api/mcp Gateway              /api/webhooks (HMAC v2)
            │                               │                               │
            └───────────────────────────────┼───────────────────────────────┘
                                            ▼
                           ┌─────────────────────────────────┐
                           │      NahaLabs Video Engine      │
                           │   (Next.js 15+ App Router)      │
                           └────────────────┬────────────────┘
                                            │
                ┌───────────────────────────┼───────────────────────────┐
                ▼                           ▼                           ▼
      [ Brand Brain Store ]      [ Industry Intelligence ]      [ OpenMontage Core ]
       - Voice Tone & WPM         - 12+ Vertical Playbooks       - 35mm Optical Physics
       - Hex Color Tokens         - Retention Curves (60s)       - Scene Decomposition
       - Compliance Blacklist     - Visual Metaphors             - Subtitle/Karaoke Sync
       - Audience ICP Personas    - Conversion Hook Formulas     - Canvas Compositor
                │                           │                           │
                └───────────────────────────┼───────────────────────────┘
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Pre-Compose Quality Gate      │
                           │  - WPM speech pacing check      │
                           │  - Compliance blacklist scan    │
                           │  - Safe margin & contrast ratio │
                           └────────────────┬────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Multi-Track Render Engine     │
                           │  - Dynamic Canvas Composition   │
                           │  - Neural Voice Synthesis       │
                           │  - Karaoke Subtitle Sync        │
                           └────────────────┬────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Post-Render Self-Review       │
                           │  - 6-Point Automated Rubric     │
                           │  - Pacing & Realism Score       │
                           │  - Actionable Critique Notes    │
                           └────────────────┬────────────────┘
                                            │
                                            ▼
                           ┌─────────────────────────────────┐
                           │   Attribution & Telemetry       │
                           │  - Intent Scoring (0-100)       │
                           │  - Watch Depth Retention        │
                           │  - PayFast / Stripe Attributed  │
                           └─────────────────────────────────┘
```

---

## 3. Core Modules & Directories

| Module | Location | Purpose |
|---|---|---|
| **Pipeline Orchestrator** | `src/lib/engine/pipeline-orchestrator.ts` | 7-stage generation workflow from intake to post-render review |
| **Brand Brain Store** | `src/lib/engine/brand-brain-store.ts` | Voice tone, reading level, WPM pacing, color palette, compliance |
| **Industry Intelligence** | `src/lib/engine/industry-intelligence.ts` | 12+ vertical industry playbooks and retention curves |
| **Pre-Compose Gate** | `src/lib/engine/precompose-validator.ts` | OpenMontage-inspired pre-render boundary and compliance validator |
| **Post-Render Review** | `src/lib/engine/post-render-reviewer.ts` | 6-criteria automated critique scoring engine |
| **Cost Governor** | `src/lib/engine/cost-governor.ts` | Token and render-second cost metering with agency benchmark comparison |
| **Realism Engine** | `src/lib/engine/realism-engine.ts` | 35mm optical parameters, camera motion vectors, lighting physics |
| **Subtitle Engine** | `src/lib/engine/subtitle-engine.ts` | Word-by-word karaoke timing, SRT and VTT export |
| **Universal MCP Gateway** | `src/app/api/mcp/route.ts` | Standardized JSON-RPC Model Context Protocol tool server |
| **HMAC v2 Security** | `src/lib/integrations/hmac-security.ts` | Cryptographic SHA256 signature generation and constant-time verification |
| **System Health** | `src/app/system-health/page.tsx` | Render keep-alive monitor, 10-minute ping scheduler, 24-hour latency graph |
| **Approvals & Collaboration** | `src/app/approvals/page.tsx` | Timestamped frame-accurate annotations and G0-G3 governance gates |
| **Telemetry & Intent** | `src/app/telemetry/page.tsx` | Lead intent scoring and closed-loop revenue attribution |

---

## 4. Security & Multi-Tenancy

- **Fail-Closed Principle:** All webhook routes default to HTTP 401 DENY if the HMAC signature header is absent or invalid.
- **Tenant Isolation:** All projects, brand brains, and telemetry events are scoped by `tenantId`.
- **Zero Env Var Build:** The application builds with zero environment variables and safely falls back to self-contained mocks for instant verification.

---

## 5. Growth OS — Autonomous Growth Layer (v3.1)

The Video Engine (above) is the **production engine**. Growth OS (`src/lib/growth/`) is the **intelligence & opportunity layer above it** that turns a single business outcome message into an approved, published, measured result. See `docs/GROWTH_OS.md` for the full spec.

```
BUSINESS OWNER (one message)
      │
      ▼
GROWTH OS (src/lib/growth)
  Business Understanding → Business/Brand Memory (tenant-store)
  Signal Engine → Research Engine (research-first; honest degradation)
  Opportunity Engine (scores; may choose a NON-video format)
  Campaign state machine + checkpoints + approval (human default; autopilot opt-in)
  Strategy Engine (versioned) + Decision Log
  Cost Guard (FREE_ONLY…) + Usage Ledger + cost-to-serve
  Publishing abstraction (OAuth; download-only fallback)
  Performance normalization + Learning (measured data only)
      │ video formats only (reel / 16:9 / 1:1)
      ▼
VIDEO ENGINE (src/lib/engine — unchanged)
  Industry Intelligence · Brand Brain · Director · Reality-first assets
  Pre-compose QC · render · Post-render review · Subtitles · Cost governor
      │
      ▼
MEASURE → LEARN → NEXT OPPORTUNITY  (closed loop)
```

- **Contracts:** `src/lib/growth/types.ts` (entities + campaign/checkpoint state machine).
- **Isolation:** data-access layer in `tenant-store.ts` requires `tenantId`; unknown tenants fail closed.
- **Honesty:** providers report real availability (`/api/growth/providers`); unconfigured capabilities degrade (real footage / captions-only / download-only) — no fake generation, render, publish, or metrics.
- **API:** `/api/growth/{organizations,campaigns,campaigns/[id],opportunities,signals,providers,connections,publications,usage}`.
- **UI:** `/growth` command center.
- **Tests:** `src/tests/unit/growth.test.ts` (29 tests) plus a full audit in `docs/GROWTH_OS_INTEGRATION_AUDIT.md`.
