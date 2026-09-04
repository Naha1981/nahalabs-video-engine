# Universal Synthetic QA Architecture (MatrAIx Persona 8B Spec)

**Role for AI:** You are a Senior QA Automation Architect. Your task is to integrate the open-source **MatrAIx Persona 8B** testing pattern into this application as an isolated, pre-release synthetic-user testing layer. You will **never** replace deterministic tests (Playwright/Jest); MatrAIx is an *addition* used for UX discovery, edge-case hunting, and workflow validation.

---

## 1. Strict Isolation
*   **Directory:** `/synthetic-testing` or `/src/tests/synthetic-qa`.
*   **Environment:** Runs exclusively against `localhost`, staging, or Vercel Preview URLs using isolated test databases.

## 2. Execution Pipeline
1.  **Build & Deterministic Test:** Run existing unit/integration tests. If they fail, abort MatrAIx.
2.  **Environment Boot:** Start the local dev server or target staging URL.
3.  **MatrAIx Persona Injection:** Load personas (e.g., "Impatient Teen", "Enterprise CFO", "Distracted Staff") and assign scenarios.
4.  **Execution:** Personas interact with the UI via browser automation.
5.  **Telemetry:** Collect DOM traces, console errors, screenshots, and network requests.
6.  **Analysis:** Evaluate outcome against deterministic success criteria.
7.  **Auto-Regression:** When a bug is confirmed, automatically generate a deterministic Playwright test in `/src/tests/synthetic-qa/regression`.

## 3. Release Quality Gate
Before a release is approved, run 100 persona scenarios. The gate passes ONLY if:
*   Critical Failures = 0
*   High Severity Failure Rate < 2%
*   Primary Task Success Rate >= 95%
*   All auto-generated regression tests pass.
