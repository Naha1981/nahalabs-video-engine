// Core-side webhook (Next.js App Router) — reference implementation.
// Path: src/app/api/webhooks/whatsapp/route.ts
//
// The Operator signs the raw body with HMAC v2 (X-Signature / X-Timestamp / X-Nonce)
// and has ALREADY resolved the authoritative tenant binding, so the Core must NOT
// look up tenancy from the client-supplied number — it reads the signed payload.
//
// Flow: verify HMAC → validate → persist → enqueue durable job → return 200 FAST.
// Never run AI/business logic in this request path.

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const inboundSchema = z.object({
  waAccountId: z.string().uuid(),
  tenantId: z.string().uuid(),
  appId: z.string().min(1),
  message: z.any(),
});

function verifyHmac(rawBody: string, signature: string | null, timestamp: string | null, nonce: string | null) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp || !nonce) return false; // fail closed

  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) return false; // replay protection

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${rawBody}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text(); // MUST be raw body for signature verification

  const ok = verifyHmac(
    rawBody,
    req.headers.get('x-signature'),
    req.headers.get('x-timestamp'),
    req.headers.get('x-nonce')
  );
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'INVALID_SIGNATURE' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'INVALID_JSON' }, { status: 400 });
  }

  const parsed = inboundSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'VALIDATION_ERROR', issues: parsed.error.issues }, { status: 400 });
  }

  const { waAccountId, tenantId, appId, message } = parsed.data;

  try {
    // 1. Persist the inbound message (idempotent on message key id).
    await persistInboundMessage({ waAccountId, tenantId, appId, messageId: message?.key?.id, message });

    // 2. Enqueue a durable PlatformJob for the worker (AI runs off-request).
    await enqueueJob({ type: 'whatsapp-inbound', waAccountId, tenantId, appId, messageId: message?.key?.id });
  } catch (err) {
    // Graceful degradation: still acknowledge so the Operator doesn't redeliver forever.
    // (In production, log + alert; consider an outbox retry on the Operator side.)
    console.error('[whatsapp-webhook] processing failed after verification', err);
  }

  // Return fast regardless — the side effects are durable and handled by the worker.
  return NextResponse.json({ ok: true });
}

// --- Replace these with your real services (or use the typed platform client). ---
async function persistInboundMessage(input: unknown): Promise<void> {
  // TODO: write to the messaging module's inbound_messages table (tenant-scoped, unique on messageId).
  void input;
}

async function enqueueJob(input: unknown): Promise<void> {
  // TODO: INSERT INTO platform_jobs ... (worker uses SELECT ... FOR UPDATE SKIP LOCKED).
  void input;
}
