/**
 * Outbox pattern for outbound WhatsApp messages — the reliable half of the flow.
 * Copy into src/lib/messaging/outbox.ts.
 *
 * Flow: enqueueOutboundMessage (DB write) → dispatchOutboxBatch (worker/cron) →
 * Operator /send → markSent | markFailed(backoff) | markDead.
 *
 * The dispatcher never reports success unless the Operator accepted the send,
 * and never loses a message: state is durable in Postgres and re-claimed with
 * FOR UPDATE SKIP LOCKED.
 */
import type { MessagingSender, OutboxRecord, OutboxStore, SendMessageInput } from './types';

export const DEFAULT_MAX_ATTEMPTS = 5;
export const BASE_BACKOFF_MS = 30_000;
export const MAX_BACKOFF_MS = 5 * 60_000;
export const STALE_SENDING_MS = 5 * 60_000;

/** Exponential backoff with jitter. Pure function — unit-testable. */
export function computeBackoff(
  attempt: number,
  baseMs: number = BASE_BACKOFF_MS,
  maxMs: number = MAX_BACKOFF_MS,
  jitter: number = 0.2,
): number {
  const exp = Math.min(baseMs * 2 ** Math.max(0, attempt - 1), maxMs);
  const factor = 1 + (Math.random() * 2 - 1) * jitter;
  // Clamp AFTER jitter so the ceiling is a hard guarantee.
  return Math.round(Math.min(exp * factor, maxMs));
}

export function nextAttemptAt(attempt: number, now: Date): Date {
  return new Date(now.getTime() + computeBackoff(attempt));
}

/** Marks a batch durable BEFORE any side effect happens. Adapter to your Drizzle/pg layer. */
export function buildOutboundInput(record: OutboxRecord): SendMessageInput {
  return { waAccountId: record.waAccountId, to: record.to, text: record.text };
}

export interface DispatchResult {
  claimed: number;
  sent: number;
  failed: number;
  dead: number;
}

export async function dispatchOutboxBatch(
  store: OutboxStore,
  sender: MessagingSender,
  options: { batchSize?: number; now?: Date } = {},
): Promise<DispatchResult> {
  const batchSize = options.batchSize ?? 50;
  const now = options.now ?? new Date();
  const result: DispatchResult = { claimed: 0, sent: 0, failed: 0, dead: 0 };

  const batch = await store.claimBatch(batchSize, now);
  result.claimed = batch.length;

  for (const record of batch) {
    try {
      const res = await sender.send(buildOutboundInput(record));
      await store.markSent(record.id, res.messageId, new Date());
      result.sent++;
    } catch (err) {
      const lastError = err instanceof Error ? err.message : String(err);
      const attempts = record.attempts + 1;
      if (attempts >= record.maxAttempts) {
        await store.markDead(record.id, lastError);
        result.dead++;
      } else {
        await store.markFailed(record.id, attempts, nextAttemptAt(attempts, now), lastError);
        result.failed++;
      }
    }
  }

  return result;
}

/** Recover messages stuck in 'sending' (a worker crashed mid-send). */
export async function recoverStaleOutbox(
  store: OutboxStore,
  staleAfterMs: number = STALE_SENDING_MS,
  now: Date = new Date(),
): Promise<number> {
  return store.requeueStale(new Date(now.getTime() - staleAfterMs));
}
