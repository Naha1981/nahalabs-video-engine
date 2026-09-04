# NahaLabs Agent Skills Library

Reusable, copy-paste engineering skills for any NahaLabs application. Each skill is a self-contained
`SKILL.md` (plus optional `references/`) following the standard **Agent Skills** format
(`name` + `description` frontmatter), so it drops straight into Cursor, Claude Code, Codex, v0,
Windsurf, or any agent that loads skills.

**The governing document is [`docs/NAHALABS_ENGINEERING_STANDARD.md`](../docs/NAHALABS_ENGINEERING_STANDARD.md) — the constitution.** Skills are the *operating procedures* that implement it.

| Skill | Load when… |
| :--- | :--- |
| [`nahalabs-engineering-lifecycle`](nahalabs-engineering-lifecycle/SKILL.md) | Starting **any** task, new app, or existing app — the step-by-step governance procedure (always load first) |
| [`nahalabs-whatsapp-operator`](nahalabs-whatsapp-operator/SKILL.md) | Building/auditing the self-owned WhatsApp infrastructure (Baileys Operator + Core webhooks) |
| [`nahalabs-telemetry-intent`](nahalabs-telemetry-intent/SKILL.md) | Adding event telemetry, intent scoring, or outcome/revenue attribution |
| [`nahalabs-synthetic-qa`](nahalabs-synthetic-qa/SKILL.md) | Wiring up E2E/API/visual/mobile/accessibility/reliability QA + MatrAIx synthetic personas |
| [`nahalabs-agent-ready-integrations`](nahalabs-agent-ready-integrations/SKILL.md) | Making the app API-first, MCP/WebMCP-ready, and Make/Zapier-compatible without vendor lock-in |
| [`nahalabs-oss-adoption`](nahalabs-oss-adoption/SKILL.md) | Evaluating and adopting an open-source repo/model/tool (due diligence + integration) |
| [`nahalabs-vercel-deployment`](nahalabs-vercel-deployment/SKILL.md) | Vercel Free-Plan deployment rules, cron-job.org scheduling, and keep-alive/health |

---

## How to use this library on a new app

1. Copy this `skills/` folder (and `docs/NAHALABS_ENGINEERING_STANDARD.md`) into the new repo.
2. Load **`nahalabs-engineering-lifecycle` first** in every session; it references the constitution
   and the other skills only when their domain applies.
3. Give the agent a **bounded, classified task** (never "build the whole app"), and require a
   Gate Report at the end.

### Prompt template

```text
You are my NahaLabs engineering agent. I am the Product Owner and ultimate authority.

Load these skills first:
- skills/nahalabs-engineering-lifecycle/SKILL.md
- docs/NAHALABS_ENGINEERING_STANDARD.md
- (domain skills as needed: nahalabs-whatsapp-operator, nahalabs-synthetic-qa, ...)

GOAL: [one clear, scoped objective]
AUTHORITY: TASK (default) | FEATURE | APPLICATION   ← explicitly granted only
SCOPE RULES:
- Read existing code before creating files. Never create parallel versions of existing components.
- Do NOT touch [off-limits files].
- Never commit secrets. Stage files explicitly — never `git add .`.
- Verify the build/tests pass before committing.

REPORT BACK (Gate Report):
- What changed and why
- Evidence table (tests, typecheck, lint, build, security)
- New commit SHA + remote sync status
- What to verify manually in production
```

---

## When to split these skills out

Once NahaLabs has several shipped apps, extract this folder + `docs/NAHALABS_ENGINEERING_STANDARD.md`
into a dedicated `nahalabs-engineering` template repo and consume it via Git submodule or a copy
step in CI — so the constitution is versioned once, not forked per app.
