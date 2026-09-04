import { describe, expect, it, vi } from 'vitest';
import {
  computeBackoff,
  dispatchOutboxBatch,
  recoverStaleOutbox,
  MAX_BACKOFF_MS,
} from '../../../reference/core-messaging/outbox';
import type {
  MessagingSender,
  OutboxRecord,
  OutboxStore,
  SendMessageInput,
} from '../../../reference/core-messaging/types';

function record(overrides: Partial<OutboxRecord> = {}): OutboxRecord {
  return {
    id: 'msg-1',
    waAccountId: '11111111-1111-1111-1111-111111111111',
    tenantId: '22222222-2222-2222-2222-222222222222',
    to: '27820000000',
    text: 'hello',
    status: 'pending',
    attempts: 0,
    maxAttempts: 5,
    nextAttemptAt: new Date(),
    dedupeKey: null,
    providerMessageId: null,
    lastError: null,
    ...overrides,
  };
}

function makeStore(batch: OutboxRecord[] = []) {
  return {
    claimBatch: vi.fn().mockResolvedValue(batch),
    markSent: vi.fn().mockResolvedValue(undefined),
    markFailed: vi.fn().mockResolvedValue(undefined),
    markDead: vi.fn().mockResolvedValue(undefined),
    requeueStale: vi.fn().mockResolvedValue(0),
  } as unknown as OutboxStore & Record<string, ReturnType<typeof vi.fn>>;
}

function makeSender(send: (input: SendMessageInput) => Promise<{ messageId: string | null }>) {
  return { send } as MessagingSender;
}

describe('computeBackoff', () => {
  it('stays within the configured ceiling', () => {
    for (let attempt = 1; attempt <= 30; attempt++) {
      expect(computeBackoff(attempt)).toBeGreaterThanOrEqual(0);
      expect(computeBackoff(attempt)).toBeLessThanOrEqual(MAX_BACKOFF_MS);
    }
  });

  it('caps at the maximum for very high attempts', () => {
    const capped = computeBackoff(10_000);
    expect(capped).toBeLessThanOrEqual(MAX_BACKOFF_MS);
  });
});

describe('dispatchOutboxBatch', () => {
  it('marks sent when the operator accepts the message', async () => {
    const store = makeStore([record()]);
    const sender = makeSender(async () => ({ messageId: 'w:1' }));

    const result = await dispatchOutboxBatch(store, sender, { batchSize: 50 });

    expect(result).toEqual({ claimed: 1, sent: 1, failed: 0, dead: 0 });
    expect(store.markSent).toHaveBeenCalledWith('msg-1', 'w:1', expect.any(Date));
    expect(store.markFailed).not.toHaveBeenCalled();
    expect(store.markDead).not.toHaveBeenCalled();
  });

  it('retries with backoff on failure', async () => {
    const store = makeStore([record({ maxAttempts: 3 })]);
    const sender = makeSender(async () => {
      throw new Error('socket disconnected');
    });

    const result = await dispatchOutboxBatch(store, sender);

    expect(result).toEqual({ claimed: 1, sent: 0, failed: 1, dead: 0 });
    expect(store.markFailed).toHaveBeenCalledWith('msg-1', 1, expect.any(Date), 'socket disconnected');
    expect(store.markDead).not.toHaveBeenCalled();
  });

  it('dead-letters after maxAttempts', async () => {
    const store = makeStore([record({ attempts: 1, maxAttempts: 2 })]);
    const sender = makeSender(async () => {
      throw new Error('permanent failure');
    });

    const result = await dispatchOutboxBatch(store, sender);

    expect(result).toEqual({ claimed: 1, sent: 0, failed: 0, dead: 1 });
    expect(store.markDead).toHaveBeenCalledWith('msg-1', 'permanent failure');
  });
});

describe('recoverStaleOutbox', () => {
  it('re-queues messages stuck in sending', async () => {
    const store = makeStore();
    store.requeueStale = vi.fn().mockResolvedValue(3) as never;

    const count = await recoverStaleOutbox(store, 5 * 60_000, new Date('2026-01-01T00:10:00Z'));

    expect(count).toBe(3);
    expect(store.requeueStale).toHaveBeenCalledWith(new Date('2026-01-01T00:05:00Z'));
  });
});
