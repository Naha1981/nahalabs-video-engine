import { NextRequest, NextResponse } from 'next/server';
import { verifyHmacV2Signature } from '@/lib/integrations/hmac-security';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signatureHeader = req.headers.get('x-nahalabs-signature') || req.headers.get('x-signature');
    const secret = process.env.WEBHOOK_SECRET || 'nahalabs_default_dev_hmac_secret_key_v2';

    const verification = verifyHmacV2Signature(signatureHeader, rawBody, secret);

    if (!verification.valid) {
      return NextResponse.json({
        success: false,
        error: 'HMAC_VERIFICATION_FAILED',
        reason: verification.reason,
      }, { status: 401 });
    }

    let payload: Record<string, any> = {};
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = { raw: rawBody };
    }

    const eventName = req.headers.get('x-nahalabs-event') || payload.event || 'generic.webhook';
    const deliveryId = req.headers.get('x-nahalabs-delivery-id') || `wh_${Date.now()}`;

    return NextResponse.json({
      success: true,
      deliveryId,
      receivedEvent: eventName,
      timestamp: new Date().toISOString(),
      status: 'processed'
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: err.message
    }, { status: 500 });
  }
}
