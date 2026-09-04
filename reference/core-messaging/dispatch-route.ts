// @ts-nocheck — reference file with ADAPT placeholders (import paths + pg pool), intentionally outside the repo's typecheck.
/**
 * Core-side scheduled route — POST /api/cron/dispatch-outbox
 * Copy into src/app/api/cron/dispatch-outbox/route.ts.
 *
 * Triggered by cron-job.org (never a Vercel cron on the Free plan). Fails closed on
 * a wrong/missing CRON_SECRET, then drains one batch of the outbox + recovers stale rows.
 *
 * ADAPT the import paths to where you copied the reference files (e.g. @/lib/messaging/...).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { getMessagingClient } from '../lib/messaging/platform-client'; // ADAPT
import { dispatchOutboxBatch, recoverStaleOutbox } from '../lib/messaging/outbox'; // ADAPT
import { createPgOutboxStore } from '../lib/messaging/outbox-store.pg'; // ADAPT (or your Drizzle store)

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!secret || !token) return false; // fail closed
  const expected = createHmac('sha256', secret).update('dispatch-outbox').digest('hex');
  const provided = token;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!authorize(req)) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const store = createPgOutboxStore(/* your pg Pool */);
  const client = getMessagingClient();

  const recovered = await recoverStaleOutbox(store);
  const result = await dispatchOutboxBatch(store, client, { batchSize: 50 });

  return NextResponse.json({ ok: true, recovered, ...result });
}

// The inbound worker route is the same shape but calls processJobBatch(...) with a
// handler that runs AI/business logic and writes the reply to the outbox.
