import crypto from 'crypto';

export interface HmacSignatureParams {
  secret: string;
  body: string | object;
  timestamp?: number;
  nonce?: string;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  timestamp?: number;
}

export function generateHmacV2Signature(params: HmacSignatureParams): {
  signature: string;
  timestamp: number;
  nonce: string;
  headerValue: string;
} {
  const secret = params.secret || 'nahalabs_default_dev_hmac_secret_key_v2';
  const timestamp = params.timestamp || Math.floor(Date.now() / 1000);
  const nonce = params.nonce || crypto.randomBytes(16).toString('hex');
  const rawBody = typeof params.body === 'string' ? params.body : JSON.stringify(params.body);

  const payload = `${timestamp}.${nonce}.${rawBody}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const headerValue = `t=${timestamp},n=${nonce},v2=${signature}`;

  return {
    signature,
    timestamp,
    nonce,
    headerValue,
  };
}

export function verifyHmacV2Signature(
  headerValue: string | null | undefined,
  body: string | object,
  secret: string = 'nahalabs_default_dev_hmac_secret_key_v2',
  maxTimeSkewSeconds: number = 300 // 5 minutes
): VerificationResult {
  if (!headerValue) {
    return { valid: false, reason: 'Missing HMAC signature header (x-nahalabs-signature)' };
  }

  // Parse header: t=1690000000,n=nonce123,v2=abcdef...
  const parts = headerValue.split(',');
  const parsed: Record<string, string> = {};
  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key && val) {
      parsed[key.trim()] = val.trim();
    }
  }

  const timestampStr = parsed['t'];
  const nonce = parsed['n'];
  const receivedSig = parsed['v2'];

  if (!timestampStr || !nonce || !receivedSig) {
    return { valid: false, reason: 'Malformed HMAC signature header structure' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid signature timestamp format' };
  }

  // Check timestamp drift
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > maxTimeSkewSeconds) {
    return { valid: false, reason: `Timestamp out of tolerance window (${Math.abs(now - timestamp)}s > ${maxTimeSkewSeconds}s)` };
  }

  const rawBody = typeof body === 'string' ? body : JSON.stringify(body);
  const payload = `${timestamp}.${nonce}.${rawBody}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Constant-time safe comparison
  const receivedBuffer = Buffer.from(receivedSig, 'hex');
  const expectedBuffer = Buffer.from(expectedSig, 'hex');

  if (receivedBuffer.length !== expectedBuffer.length) {
    return { valid: false, reason: 'Signature length mismatch' };
  }

  const isMatch = crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
  if (!isMatch) {
    return { valid: false, reason: 'Cryptographic signature mismatch' };
  }

  return { valid: true, timestamp };
}
