# MoneyPrinterTurbo — Integration Audit

**Date:** 2026-09-03.
**Purpose:** Per master integration prompt §20, audit MoneyPrinterTurbo for reusable capabilities under our classification scheme.

> Not legal advice, but the licensing situation here is materially simpler than OpenMontage.

## 1. License finding
- `harry0703/MoneyPrinterTurbo` is **MIT licensed** (Python). It turns a single topic/keyword into a finished short: LLM script → stock footage (Pexels/Pixabay/Coverr) → TTS voiceover → subtitles → MoviePy/FFmpeg assembly → MP4, via a Streamlit UI or REST API [1](https://www.verdent.ai/guides/moneyprinterturbo-github) [2](https://ghtrends.dev/harry0703/MoneyPrinterTurbo/).
- **Important caveat [1]:** the *software* is MIT, but the **output footage** comes from third-party stock APIs whose licenses must be cleared per-clip for commercial use. "Free" footage is not automatically cleared; attribution requirements vary. NahaLabs already tracks asset **provenance/licensing** for exactly this reason.

## 2. Classification (per §20)

| Capability | Classification | Note |
|---|---|---|
| Topic → script (LLM) | **ADAPT** | Pattern matches our research→strategy→script; we keep research-first and business grounding. |
| Stock-media selection (Pexels/Pixabay) | **REUSE (adapter pattern)** | Behind our `StockProvider` interface (`providers.ts`); provenance/license recorded per asset. |
| TTS voiceover | **REUSE (adapter pattern)** | Behind our `VoiceProvider` interface; ElevenLabs/Edge TTS equivalent. |
| Subtitles | **REUSE (already native)** | Video Engine `subtitle-engine.ts` already does word cues + SRT/VTT. |
| Background music | **ADAPT** | Behind `MusicProvider`. |
| MoviePy/FFmpeg assembly → MP4 | **REFERENCE ONLY → REIMPLEMENT** | Use FFmpeg directly via our renderer; do not adopt Streamlit UI. |
| Batch production / API usage | **ADAPT (concept)** | Feeds our worker/queue + checkpoint model. |
| Provider abstraction in the tool | **REFERENCE ONLY** | We already abstract providers (`providers.ts`); do not scatter vendor calls. |
| Streamlit web UI | **DO NOT USE** | NahaLabs is Next.js; UI not portable. |

## 3. What we borrow vs. ignore
- **Borrow:** the proven pipeline shape (topic/objective → script → footage → voice → subtitles → music → assembled MP4) and the concrete provider list (Pexels/Pixabay, Edge/ElevenLabs TTS) as **adapters behind our interfaces**.
- **Ignore:** the Streamlit app, hardcoded provider calls, and the "bare prompt with no research" assumption — NahaLabs enforces **research precedes generation** and business/opportunity grounding on top.
- **License-safe:** because MPT is MIT, we can reuse/adapt code, but we (a) keep it behind our provider/engine interfaces, and (b) **clear stock-clip licenses** and record provenance for every commercial output.

## 4. Status in this milestone
- Provider **interfaces and availability registry** exist (`providers.ts`) for stock, voice, music, transcription, video, image, renderer.
- Concrete Pexels/TTS adapters are **env-gated TODOs** — until keys are configured, the system reports `unconfigured` and degrades honestly (client assets / captions-only / download-only) rather than faking output.
