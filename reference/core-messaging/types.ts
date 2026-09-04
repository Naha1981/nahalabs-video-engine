/**
 * Core-side messaging types (shared by the platform client, outbox, and job worker).
 * Copy into your app under src/lib/messaging/types.ts.
 */

export type OutboxStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'dead';

export type JobStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'dead';

export interface SendMessageInput {
  waAccountId: string;
  to: string;
  text: string;
}

export interface SendResult {
  /** Operator-side message id when available, otherwise null. */
  messageId: string | null;
}

/** Minimal contract the outbox dispatcher needs — the platform client implements this. */
export interface MessagingSender {
  send(input: SendMessageInput): Promise<SendResult>;
}

export interface OutboxRecord {
  id: string;
  waAccountId: string;
  tenantId: string;
  to: string;
  text: string;
  status: OutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  dedupeKey: string | null;
  providerMessageId: string | null;
  lastError: string | null;
}

export interface OutboxStore {
  /** Atomically claim a batch (FOR UPDATE SKIP LOCKED), flipping status to 'sending'. */
  claimBatch(limit: number, now: Date): Promise<OutboxRecord[]>;
  markSent(id: string, providerMessageId: string | null, now: Date): Promise<void>;
  markFailed(id: string, attempts: number, nextAttemptAt: Date, lastError: string): Promise<void>;
  markDead(id: string, lastError: string): Promise<void>;
  /** Re-queue messages stuck in 'sending' (worker crashed mid-send). Returns count. */
  requeueStale(staleBefore: Date): Promise<number>;
}

export interface PlatformJob {
  id: string;
  type: string;
  tenantId: string;
  payload: unknown;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  lastError: string | null;
}

export interface JobStore {
  claimBatch(types: string[], limit: number, now: Date): Promise<PlatformJob[]>;
  markSucceeded(id: string): Promise<void>;
  markFailed(id: string, attempts: number, nextAttemptAt: Date, lastError: string): Promise<void>;
  markDead(id: string, lastError: string): Promise<void>;
}

export type JobHandler = (job: PlatformJob) => Promise<void>;
