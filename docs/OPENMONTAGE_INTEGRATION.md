# OpenMontage — Integration Map (concepts, not code)

**Date:** 2026-09-03.
**Companion:** read `OPENMONTAGE_LICENSE_AUDIT.md` first. The prominent `calesthio/OpenMontage` lineage is **AGPL-3.0**; therefore we integrate **concepts via clean-room reimplementation**, not vendored code, unless legal approves otherwise.

OpenMontage's documented model: an AI coding assistant reads **YAML pipeline manifests** and **Markdown stage-director skills**, executes **tools** for research → script → scene plan → assets → edit → compose → render, with **checkpoints** (resumable JSON state), **budget caps / cost estimation before action**, **pre-compose validation**, and **post-render review**, and asks for approval at creative decision points [1](https://www.explainx.ai/blog/openmontage-agentic-video-production-claude-code-2026).

## Capability mapping

| OpenMontage concept | NahaLabs equivalent | Status |
|---|---|---|
| Pipeline manifest (named production flows) | `industry-packs.ts` opportunity templates + Video Engine funnel scenes | ✅ implemented (our own design) |
| Stage-director skills | Industry Packs (research angles, compliance rules, angles) | ✅ implemented |
| Research stage before generation | `research-engine.ts` (research-first hard rule, honest degradation) | ✅ implemented |
| Scripting / scene plan | Video Engine `pipeline-orchestrator.ts` (pre-existing) | ✅ exists |
| Asset retrieval (Archive.org / free stock) | Reality-first asset hierarchy; `providers.ts` stock descriptor | ⚠️ interface present, provider adapters TODO |
| Asset generation (FLUX/Kling/Veo) | `providers.ts` image/video descriptors + Cost Guard | ⚠️ interface present, adapters env-gated |
| Narration (Piper TTS offline; cloud TTS) | `providers.ts` voice descriptor; Video Engine audio stage | ⚠️ interface present |
| Music | `providers.ts` music descriptor | ⚠️ interface present |
| Subtitles | Video Engine `subtitle-engine.ts` (SRT/VTT, word cues) | ✅ exists |
| Edit / compose / render (FFmpeg, Remotion, HyperFrames) | Video Engine render stage + `providers.ts` renderer descriptor | ⚠️ QC real; final server render env-gated |
| Checkpoints / resumable state | `CHECKPOINT_ORDER`, `resumeFromCheckpoint` | ✅ implemented |
| Budget cap / cost estimation before action | Cost Guard (`FREE_ONLY`…), Usage Ledger, cost-to-serve | ✅ implemented |
| Pre-compose validation | `precompose-validator.ts` (pre-existing) | ✅ exists |
| Post-render review | `post-render-reviewer.ts` (pre-existing) + Growth QC gate | ✅ exists |
| Approval at decision points | Campaign approval state machine; human approval default | ✅ implemented |
| Decision/audit trail | Decision log + audit log | ✅ implemented |
| Free-only baseline path (Piper/FFmpeg/stock, zero API keys) | Provider registry + degraded modes (§57) | ✅ philosophy adopted |

## How NahaLabs differs (and keeps its moat)
OpenMontage starts from *"make a video."* NahaLabs starts from the **business objective** and runs the **growth loop**: business understanding → signals → research → **opportunity (which may decide video is the wrong format)** → campaign → strategy → production → approval → publish → measure → learn. OpenMontage is a capability source **underneath** that loop; the moat is business understanding, opportunity selection, and closed-loop learning.

## Future work (license-safe)
- Evaluate an **MIT-licensed** OpenMontage lineage's `LICENSE` file before any code reuse.
- Optionally run an unmodified OpenMontage as an isolated **subprocess/worker** behind our `ProductionEngine` interface — only after legal confirms the network-use boundary.
- Clean-room implement the documentary-montage real-footage retrieval pattern using our own stock/asset adapters with provenance tracking.
