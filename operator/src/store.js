import pg from 'pg';
import { BufferJSON } from '@whiskeysockets/baileys';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: /sslmode=(require|verify)/.test(process.env.DATABASE_URL ?? '')
    ? { rejectUnauthorized: false }
    : undefined,
});

/** Auto-creates the Operator's tables on boot (raw pg — Baileys session state). */
export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_accounts (
      wa_account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      phone_number  TEXT,
      is_connected  BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- value is TEXT: serialized with Baileys BufferJSON so Buffers survive a round-trip.
    CREATE TABLE IF NOT EXISTS wa_sessions (
      wa_account_id UUID NOT NULL,
      key           TEXT NOT NULL,
      value         TEXT NOT NULL,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (wa_account_id, key)
    );

    CREATE TABLE IF NOT EXISTS wa_account_bindings (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wa_account_id UUID NOT NULL REFERENCES wa_accounts(wa_account_id) ON DELETE CASCADE,
      app_id        TEXT NOT NULL,
      tenant_id     UUID NOT NULL,
      webhook_url   TEXT NOT NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (wa_account_id, app_id, tenant_id)
    );

    CREATE TABLE IF NOT EXISTS inbound_delivery (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      message_id    TEXT NOT NULL,
      wa_account_id UUID NOT NULL,
      tenant_id     UUID NOT NULL,
      app_id        TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (wa_account_id, tenant_id, app_id, message_id)
    );

    CREATE INDEX IF NOT EXISTS idx_bindings_account ON wa_account_bindings(wa_account_id);
  `);
}

export async function getSession(waAccountId, key) {
  const { rows } = await pool.query(
    'SELECT value FROM wa_sessions WHERE wa_account_id = $1 AND key = $2',
    [waAccountId, key]
  );
  if (!rows.length) return null;
  return BufferJSON.parse(rows[0].value);
}

export async function saveSession(waAccountId, key, value) {
  await pool.query(
    `INSERT INTO wa_sessions (wa_account_id, key, value, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (wa_account_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [waAccountId, key, BufferJSON.stringify(value)]
  );
}

export async function getAccount(waAccountId) {
  const { rows } = await pool.query(
    'SELECT wa_account_id, phone_number, is_connected FROM wa_accounts WHERE wa_account_id = $1',
    [waAccountId]
  );
  return rows[0] ?? null;
}

export async function updateAccount(waAccountId, fields) {
  await pool.query(
    `INSERT INTO wa_accounts (wa_account_id, phone_number, is_connected)
     VALUES ($1, $2, $3)
     ON CONFLICT (wa_account_id)
     DO UPDATE SET phone_number = COALESCE(EXCLUDED.phone_number, wa_accounts.phone_number),
                   is_connected = EXCLUDED.is_connected`,
    [waAccountId, fields.phone_number ?? null, fields.is_connected ?? false]
  );
}

export async function getBindings(waAccountId) {
  const { rows } = await pool.query(
    'SELECT id, wa_account_id, app_id, tenant_id, webhook_url FROM wa_account_bindings WHERE wa_account_id = $1',
    [waAccountId]
  );
  return rows;
}

/** Idempotent claim: returns true only the first time this (binding, message) pair is seen. */
export async function claimInboundDelivery(binding, messageId) {
  const { rowCount } = await pool.query(
    `INSERT INTO inbound_delivery (message_id, wa_account_id, tenant_id, app_id, status)
     VALUES ($1, $2, $3, $4, 'pending')
     ON CONFLICT (wa_account_id, tenant_id, app_id, message_id) DO NOTHING`,
    [messageId, binding.wa_account_id, binding.tenant_id, binding.app_id]
  );
  return rowCount > 0;
}

export async function markDeliveryStatus(binding, messageId, status) {
  await pool.query(
    `UPDATE inbound_delivery SET status = $5
     WHERE wa_account_id = $1 AND tenant_id = $2 AND app_id = $3 AND message_id = $4`,
    [binding.wa_account_id, binding.tenant_id, binding.app_id, messageId, status]
  );
}

export async function ping() {
  await pool.query('SELECT 1');
}

export async function closePool() {
  await pool.end();
}
