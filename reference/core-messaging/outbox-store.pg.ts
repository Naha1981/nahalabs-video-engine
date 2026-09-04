// @ts-nocheck — reference file: requires `pg` (npm i pg), intentionally outside the repo's typecheck.
/**
 * Reference PostgreSQL implementation of OutboxStore (node-postgres).
 * NOTE: this file is intentionally outside the repo's typecheck — install `pg`
 * (`npm i pg`) to use it, or map these queries 1:1 to Drizzle in your Core app.
 */
import pg from 'pg';
import type { OutboxRecord, OutboxStore } from './types';

const CLAIM_SQL = `
  WITH claimed AS (
    SELECT id FROM outbox_message
    WHERE status IN ('pending','failed') AND next_attempt_at <= $1
    ORDER BY created_at
    LIMIT $2
    FOR UPDATE SKIP LOCKED
  )
  UPDATE outbox_message m SET status = 'sending', updated_at = now()
  FROM claimed c WHERE m.id = c.id
  RETURNING m.*`;

function mapRow(row: Record<string, unknown>): OutboxRecord {
  return {
    id: String(row.id),
    waAccountId: String(row.wa_account_id),
    tenantId: String(row.tenant_id),
    to: String(row.to_number),
    text: String(row.text),
    status: row.status as OutboxRecord['status'],
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    nextAttemptAt: new Date(row.next_attempt_at as string),
    dedupeKey: (row.dedupe_key as string | null) ?? null,
    providerMessageId: (row.provider_message_id as string | null) ?? null,
    lastError: (row.last_error as string | null) ?? null,
  };
}

export function createPgOutboxStore(pool: pg.Pool): OutboxStore {
  return {
    async claimBatch(limit, now) {
      const { rows } = await pool.query(CLAIM_SQL, [now.toISOString(), limit]);
      return rows.map(mapRow);
    },

    async markSent(id, providerMessageId, now) {
      await pool.query(
        `UPDATE outbox_message
         SET status='sent', provider_message_id=$2, updated_at=$3
         WHERE id=$1`,
        [id, providerMessageId, now.toISOString()],
      );
    },

    async markFailed(id, attempts, nextAttemptAt, lastError) {
      await pool.query(
        `UPDATE outbox_message
         SET status='failed', attempts=$2, next_attempt_at=$3, last_error=$4, updated_at=now()
         WHERE id=$1`,
        [id, attempts, nextAttemptAt.toISOString(), lastError],
      );
    },

    async markDead(id, lastError) {
      await pool.query(
        `UPDATE outbox_message SET status='dead', last_error=$2, updated_at=now() WHERE id=$1`,
        [id, lastError],
      );
    },

    async requeueStale(staleBefore) {
      const { rowCount } = await pool.query(
        `UPDATE outbox_message
         SET status='failed', next_attempt_at=now(), updated_at=now()
         WHERE status='sending' AND updated_at < $1`,
        [staleBefore.toISOString()],
      );
      return rowCount ?? 0;
    },
  };
}
