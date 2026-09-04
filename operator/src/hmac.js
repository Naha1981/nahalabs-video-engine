import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

/**
 * HMAC v2 signing scheme (shared with the Core app):
 *   signature = hex( HMAC-SHA256( secret, `${timestamp}.${nonce}.${rawBody}` ) )
 * Delivered via headers: X-Signature, X-Timestamp, X-Nonce.
 */
export function sign(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${payload}`)
    .digest('hex');
  return { signature, timestamp, nonce };
}

/** Verifies a signature and rejects stale timestamps (replay protection). */
export function verify(payload, signature, timestamp, nonce, secret, { toleranceSeconds = 300 } = {}) {
  if (!signature || !timestamp || !nonce) return false;
  const ts = Number(timestamp);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${nonce}.${payload}`)
    .digest('hex');
  return constantTimeEqual(expected, signature);
}

/** Constant-time string comparison (for API keys and signatures). */
export function constantTimeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
