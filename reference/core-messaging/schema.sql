-- Core-side tables for the NahaLabs Messaging Platform.
-- Managed by Drizzle in the real Core app; this is the canonical SQL shape.
-- (The Operator owns wa_accounts / wa_sessions / wa_account_bindings / inbound_delivery.)

-- Outbound messages (AI/business → customer). The Outbox pattern's durable record.
CREATE TABLE IF NOT EXISTS outbox_message (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wa_account_id      UUID        NOT NULL,
  tenant_id          UUID        NOT NULL,
  to_number          TEXT        NOT NULL,
  text               TEXT        NOT NULL,
  status             TEXT        NOT NULL DEFAULT 'pending',  -- pending|sending|sent|failed|dead
  attempts           INT         NOT NULL DEFAULT 0,
  max_attempts       INT         NOT NULL DEFAULT 5,
  next_attempt_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  dedupe_key         TEXT,
  provider_message_id TEXT,
  last_error         TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency: one dedupe_key → one outbound message (never double-send).
CREATE UNIQUE INDEX IF NOT EXISTS uq_outbox_dedupe
  ON outbox_message (dedupe_key) WHERE dedupe_key IS NOT NULL;

-- Dispatcher claim index (status + next_attempt_at).
CREATE INDEX IF NOT EXISTS idx_outbox_dispatch
  ON outbox_message (status, next_attempt_at);

-- Durable jobs (inbound processing, and any background work).
CREATE TABLE IF NOT EXISTS platform_job (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            TEXT        NOT NULL,               -- e.g. 'whatsapp-inbound'
  tenant_id       UUID        NOT NULL,
  payload         JSONB       NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'queued', -- queued|processing|succeeded|failed|dead
  attempts        INT         NOT NULL DEFAULT 0,
  max_attempts    INT         NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_dispatch
  ON platform_job (status, next_attempt_at);

-- Inbound messages (customer → AI), idempotent on the WhatsApp message id.
CREATE TABLE IF NOT EXISTS inbound_message (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    TEXT   NOT NULL,
  wa_account_id UUID   NOT NULL,
  tenant_id     UUID   NOT NULL,
  app_id        TEXT   NOT NULL,
  payload       JSONB  NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (wa_account_id, tenant_id, app_id, message_id)
);

-- ---- Claim SQL (what the store's claimBatch runs) -----------------------------
-- Outbox:
--   WITH claimed AS (
--     SELECT id FROM outbox_message
--     WHERE status IN ('pending','failed') AND next_attempt_at <= $1
--     ORDER BY created_at
--     LIMIT $2
--     FOR UPDATE SKIP LOCKED
--   )
--   UPDATE outbox_message m SET status='sending', updated_at=now()
--   FROM claimed c WHERE m.id = c.id
--   RETURNING m.*;
--
-- Jobs (same pattern, with optional type filter):
--   WITH claimed AS (
--     SELECT id FROM platform_job
--     WHERE status IN ('queued','failed') AND next_attempt_at <= $1
--       AND ($3::text[] IS NULL OR type = ANY($3::text[]))
--     ORDER BY created_at
--     LIMIT $2
--     FOR UPDATE SKIP LOCKED
--   )
--   UPDATE platform_job j SET status='processing', updated_at=now()
--   FROM claimed c WHERE j.id = c.id
--   RETURNING j.*;
