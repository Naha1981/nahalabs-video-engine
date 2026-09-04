---
name: nahalabs-telemetry-intent
description: Add a reusable Observe → Understand → Score → Decide → Act → Measure → Learn intelligence layer (event telemetry, deterministic rules, intent scoring, next-best-action, outcome/revenue attribution) to any NahaLabs app. Deterministic first, AI last.
---

# NahaLabs Telemetry & Intent Intelligence Skill

## Principle

Do not add random analytics code. Build a reusable **intelligence layer**:
`Observe → Understand → Score → Decide → Act → Measure → Learn`.

Use the simplest reliable mechanism for each problem: telemetry to observe, **logic rules** for
deterministic decisions, cron for scheduled work, **AI only** for prediction/classification/
reasoning/recommendation/generation, actions to change UX, outcome telemetry to prove it worked.

## 1. Inspect before instrumenting

Identify application type, existing architecture (frontend/backend/db/auth/APIs/webhooks/payments/
messaging/analytics/jobs), and the important user journeys:
`Acquisition → Activation → Engagement → Conversion → Retention → Expansion`.

## 2. Event design

- Name events `verb_object`: `product_viewed`, `checkout_started`, `payment_completed`,
  `reservation_created`, `message_replied`. Never `button_17_clicked`.
- Minimum schema: `event_id · event_name · event_version · timestamp · anonymous_id · user_id ·
  session_id · tenant_id · source · channel · object_type · object_id · properties`.
- Critical business events are generated **server-side**; payment truth comes from provider webhooks,
  never from `payment_button_clicked`.
- Version events; never silently change an existing event's meaning.

## 3. Deterministic before AI

```text
IF order_count > 5 THEN frequent_customer = true            (rule — never ask an LLM)
IF cart_created AND checkout_started AND NOT paid AND elapsed > window THEN abandoned_cart = true
```

Aggregate raw events into signals first. **Do not send every event to an LLM.**
Intent scores must be explainable: `Intent 87 = +20 checkout started, +15 pricing viewed, …`.

## 4. AI layer (only where it earns its cost)

Classification (intent/sentiment/category) · prediction (churn/reorder/conversion/demand/LTV) ·
recommendation (next best action/offer) · reasoning (why revenue changed) · generation
(WhatsApp/email/offer copy). Validate AI output (Zod + policy) before any side effect.

## 5. Action → outcome → attribution loop

Every action emits events: `recommendation_created → action_approved → message_sent → delivered →
opened → CTA_clicked → conversion_completed`. Track `campaign_id · action_id · customer_id ·
order_id · revenue · margin · timestamp · attribution_window`. Use careful language
("attributed / influenced / assisted") unless causation is genuinely measured.

## 6. Privacy, consent, reliability

- Minimize data; respect POPIA; never secretly track across contexts; distinguish anonymous telemetry
  from identified customer data. Check consent before any consequential communication.
- Telemetry must **never block or break** the core path (checkout/order/payment). Async, durable,
  idempotent, deduplicated, with retry + dead-letter.
- Multi-tenant: every event carries `tenant_id`; enforce isolation at the DB layer.

## 7. Implementation order

Inspect → map journeys → define outcomes → event inventory → event schema → ingestion → storage →
**deterministic rules** → profiles → scoring → cron (only for periodic work) → AI → action engine →
outcome tracking → attribution → dashboards → privacy/consent controls → tests → monitor → optimize.

## Decision matrix

| Mechanism | Use when |
| :--- | :--- |
| Cron | periodic/batch processing |
| Logic rules | deterministic conditions |
| AI | prediction/classification/reasoning/recommendation/generation |
| HTML/WhatsApp/Mobile/API telemetry | channel behaviour |
| Payment webhooks | payment truth |
| Attribution | measuring business outcome |

## Golden rule

Every intelligent feature must close the loop: `EVENT → SIGNAL → RULE → AI → DECISION → ACTION →
USER RESPONSE → OUTCOME → REVENUE/KPI → LEARNING`. No intelligence without a measurable outcome.
