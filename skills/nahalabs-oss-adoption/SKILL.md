---
name: nahalabs-oss-adoption
description: Evaluate and adopt an open-source repo, model, or tool (dependency / fork / separate service / extract-component) with due diligence and a POC before production. Convert research into a software decision, not "cool repo collecting."
---

# NahaLabs Open-Source Adoption Skill

## Pipeline

```text
DISCOVER → UNDERSTAND → LICENSE CHECK → ARCHITECTURE REVIEW → SECURITY REVIEW → FIT ANALYSIS →
BUILD/BUY/FORK DECISION → PROOF OF CONCEPT → INTEGRATION DESIGN → ISOLATED INTEGRATION →
TEST → HARDEN → PRODUCTIONIZE
```

## 1. Four adoption modes

| Mode | Use when | Example |
| :--- | :--- | :--- |
| **Dependency** | stable, maintained library with clean API | Next.js, Zod, Playwright, Drizzle |
| **Fork** | project is 60–90% of what you need; you want ownership | a niche self-hosted tool |
| **Separate service** | full app that should run beside yours behind an API | OCR service, vector store |
| **Extract component** | you only need one module — wrap it in an **adapter** | `App → interface → adapter → external` |

Never scatter external repo code through your app; wrap it so it is replaceable tomorrow.
When forking, track upstream — don't fork and forget.

## 2. Due-diligence checklist

Problem it solves · maintainers/activity · documentation · license + commercial use · known CVEs ·
dependency count · does it run locally/deploy · tests · production readiness · required infra/DB ·
scalability · replaceability · architecture fit.

**The key question:** *will this reduce my engineering work, or merely move the complexity into my app?*

## 3. Model adoption (Hugging Face etc.)

Task → evaluation → license → hardware → benchmark → POC → **model adapter** → integrate → monitor.
Application code calls `classifyDocument()`, never a specific model. Know input/output/accuracy/
latency/VRAM/CPU-capable/commercial-license/self-hostable/failure behavior.

## 4. Capability card (for every tech you research)

`NAME · SOURCE · PROBLEM SOLVED · INPUT · OUTPUT · FIT · ALTERNATIVES · LICENSE · COST ·
SELF-HOSTABLE · API · HARDWARE · LATENCY · SECURITY RISKS · INTEGRATION DIFFICULTY ·
RECOMMENDATION: ADOPT / POC / WATCH / REJECT`.

## 5. Production gate

Review for security, authn/authz, secrets, validation, rate limits, logging, privacy/POPIA,
prompt injection, tool abuse, permissions, cost/token control, reliability, retries, timeouts,
tenant isolation. **Example code in a repo is not production-ready merely because it exists.**
Preserve required license notices.

## Final rule

Find the right tool for the layer, integrate cleanly, deploy today, replace tomorrow.
The architecture is the blueprint; tools are building blocks.
