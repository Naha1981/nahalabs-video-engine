---
name: nahalabs-agent-ready-integrations
description: Make any NahaLabs app API-first, event-driven, and agent-ready (MCP/WebMCP) with optional Make/Zapier adapters — without vendor lock-in and without duplicating business logic. Build the core first; integrations are adapters, never the backend.
---

# NahaLabs Agent-Ready Integration Skill

## Principle

**Build the application's own API and event system first.** One application core (`UI + API + Events`)
is consumed by many interfaces: REST, webhooks, MCP, WebMCP, Make, Zapier, other agents.
No integration may become the app's backend, and no client bypasses the service layer.

```
ONE APPLICATION CORE (services + validation + authz + DB)
      ├── REST API (/api/v1/…)        ├── Webhooks (out)
      ├── MCP (safe tools)            ├── WebMCP (browser agents)
      └── Make / Zapier / n8n adapters (optional)
```

## 1. API-first

- Every meaningful capability has an API equivalent: `POST/GET/PATCH /api/v1/customers`, orders,
  campaigns, messages, analytics. Predictable REST, **versioned** (`/api/v1` → `/api/v2`).
- Structured errors: `{ error: { code, message, request_id } }`; never stack traces.
- Idempotency keys for anything that creates/mutates (payments, orders, messages, campaigns).
- Document at `/docs/integrations/`: api.md, webhooks.md, events.md, mcp.md, authentication.md, examples.md.

## 2. Webhooks (out)

First-class, signed, retried with exponential backoff, event IDs, delivery logs, dead-letter.
Payloads carry IDs only — the receiver fetches the full object via the API. Consumers must tolerate
duplicates (`Idempotency-Key` + event IDs).

## 3. MCP / WebMCP (agents)

- Thin adapter over real services — **never direct DB access**, never `do_everything(user_prompt)`.
- Tool shape: `name · description (when to use / not use) · input schema · output · validation ·
  authn · authz · error handling`. Prefer small composable tools (`search_products`, `check_inventory`).
- Classify capabilities: **read** (low risk) / **reversible** / **consequential** (place order, refund,
  delete, send). Consequential = **preview → human confirmation → execute → verify → audit**.
- Track agent activity separately (tool calls, success/failure, confirmations, revenue influenced).
- Feature-flag the agent surface (`MCP_ENABLED`, `WEBMCP_ENABLED`) so the app works with it off.

## 4. Make / Zapier (adapters, not the core)

Expose triggers/actions/searches that translate to the NahaLabs API. Keep parity where sensible, but
only expose operations that make sense to an automation user. Never recreate business logic in a
scenario/flow; never hardcode secrets; never give a connector direct DB access.

## 5. Security & multi-tenancy

Every request resolves `principal → credential → tenant → authorization → service → DB`. Never trust
a client-supplied `tenant_id` without verifying the principal owns it. Rate-limit per client type.
Audit-log integration actions (actor, integration, action, resource, success, request_id — no secrets).

## Definition of done

Core works without any automation vendor · versioned API · authn/authz · tenant isolation · signed
idempotent webhooks · MCP tools where useful · consequential actions require confirmation ·
integration tests · docs · no secrets committed · no connector with direct DB access.
