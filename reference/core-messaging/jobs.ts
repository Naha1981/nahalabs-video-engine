/**
 * Durable job worker for inbound WhatsApp processing (and any other background work).
 * Copy into src/lib/messaging/jobs.ts.
 *
 * The webhook only PERSISTS + ENQUEUES and returns 200 fast. This worker claims jobs
 * with FOR UPDATE SKIP LOCKED and runs the handler (AI/business logic) off-request,
 * then writes the reply to the outbox (see outbox.ts).
 */
import { computeBackoff } from './outbox';
import type { JobHandler, JobStore } from './types';

export interface JobBatchResult {
  claimed: number;
  succeeded: number;
  failed: number;
  dead: number;
}

export async function processJobBatch(
  store: JobStore,
  handler: JobHandler,
  options: { types?: string[]; batchSize?: number; now?: Date } = {},
): Promise<JobBatchResult> {
  const types = options.types ?? [];
  const batchSize = options.batchSize ?? 20;
  const now = options.now ?? new Date();
  const result: JobBatchResult = { claimed: 0, succeeded: 0, failed: 0, dead: 0 };

  const batch = await store.claimBatch(types, batchSize, now);
  result.claimed = batch.length;

  for (const job of batch) {
    try {
      await handler(job);
      await store.markSucceeded(job.id);
      result.succeeded++;
    } catch (err) {
      const lastError = err instanceof Error ? err.message : String(err);
      const attempts = job.attempts + 1;
      if (attempts >= job.maxAttempts) {
        await store.markDead(job.id, lastError);
        result.dead++;
      } else {
        const next = new Date(now.getTime() + computeBackoff(attempts));
        await store.markFailed(job.id, attempts, next, lastError);
        result.failed++;
      }
    }
  }

  return result;
}
