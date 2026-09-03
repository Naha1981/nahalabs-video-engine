# OpenMontage — License & Integration Audit

**Date:** 2026-09-03.
**Purpose:** Per the master integration prompt §19, identify the exact OpenMontage upstream and its license **before** copying any code, because the ecosystem has materially different forks/licenses.

> ⚠️ This is an engineering audit, **not legal advice**. Confirm with legal counsel before wrapping copyleft code in a paid SaaS.

---

## 1. Finding — the ecosystem is split

There are **multiple OpenMontage lineages with different licenses**:

| Lineage | License | Evidence |
|---|---|---|
| `calesthio/OpenMontage` (the most prominent/trending lineage; "world's first open-source agentic video production system", Python, 12 pipelines, ~52 tools, hundreds of agent skills) | **GNU AGPL-3.0** | TrendShift repository record lists "GNU Affero General Public License v3.0" [4](https://trendshift.io/repositories/24682); the AI Agent Store catalog also lists it as "AGPL-3.0 open-source" [3](https://aiagentstore.ai/ai-agent/openmontage); the explainX FAQ states "License: AGPL-3.0 — mind network/SaaS obligations" and explicitly notes the SaaS trigger [1](https://www.explainx.ai/blog/openmontage-agentic-video-production-claude-code-2026). |
| `OpenMontage-app/OpenMontage` (a separate app lineage) | Reported **MIT** in some write-ups | One third-party guide states "100% Open Source — MIT licensed" for the OpenMontage quick-start [2](https://www.coddykit.com/pages/blog-detail?id=512872&slug=openmontage-how-to-turn-your-ai-coding-assistant-into-a-full-video-production-st). |

**The most visible, actively-maintained lineage (`calesthio/OpenMontage`) is AGPL-3.0, not MIT.** Any article claiming "MIT" must be checked against the specific repo's `LICENSE` file before reliance.

## 2. Why AGPL matters for NahaLabs

NahaLabs is a **multi-tenant SaaS** that users interact with **over a network**. AGPL-3.0's §13 network-use clause generally requires that, if you **modify** AGPL-licensed software and make it available as a network service, you offer the **complete corresponding source** (including your modifications) to those users.

Consequences:
- Vendoring/modifying `calesthio/OpenMontage` code into NahaLabs-as-a-Service risks a source-disclosure obligation over the whole service.
- Merely *calling* it as an isolated, unmodified external process is a different calculus from embedding/modifying it — but still requires counsel review.
- Using it to generate **output** (videos) does not propagate the license to the output the way it propagates to modified source, but the service wrapper is the risk.

## 3. Classification decision (per §19)

| OpenMontage capability | Classification | Rationale |
|---|---|---|
| Pipeline-manifest / stage-skill architecture | **REFERENCE ONLY → ADAPT (clean-room)** | Reimplemented as NahaLabs Growth Loop checkpoints + state machine; no code copied. |
| Checkpoints / resumable JSON state | **ADAPT (concept)** | Implemented as `CHECKPOINT_ORDER` + `resumeFromCheckpoint` from the concept, not the code. |
| Budget cap / cost estimate before execution | **ADAPT (concept)** | NahaLabs Cost Guard + Usage Ledger already implemented independently. |
| Pre-compose validation / post-render review | **REUSE (already native)** | NahaLabs already has `precompose-validator.ts` and `post-render-reviewer.ts`. |
| Documentary montage / real-footage cutting (Archive.org, CLIP search) | **REFERENCE ONLY** | Aligns with our reality-first asset hierarchy; may adapt the *pattern* clean-room later. |
| Python tool implementations (research, TTS wrappers, Remotion/HyperFrames compose) | **DO NOT COPY (from AGPL lineage)** | Do not vendor into the SaaS without legal approval. Reimplement behind provider interfaces or use MIT-licensed equivalents. |
| Any `calesthio` source file | **DO NOT COPY** pending legal sign-off | AGPL-3.0 network-use risk. |

## 4. Recommended path
1. **Do not copy** any code from `calesthio/OpenMontage` until legal confirms the deployment model.
2. If an OpenMontage capability is needed, either (a) clean-room **reimplement** from the documented *concept* (we have done this for manifests/checkpoints/cost-caps), or (b) verify an **MIT-licensed** lineage's actual `LICENSE` file and use only that.
3. Keep OpenMontage-derived ideas **architectural** (the manifest/skill/checkpoint mental model), which is not protected by copyright.

See also: `OPENMONTAGE_INTEGRATION.md` for the capability mapping.
