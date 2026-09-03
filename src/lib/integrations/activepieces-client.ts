import { generateHmacV2Signature } from './hmac-security';

export interface WebhookDispatchOptions {
  targetUrl: string;
  eventType: 'video.rendered' | 'approval.submitted' | 'intent.high_value_detected' | 'budget.warning';
  payload: Record<string, any>;
  secret?: string;
}

export interface WebhookDeliveryLog {
  id: string;
  targetUrl: string;
  eventType: string;
  timestamp: string;
  status: 'delivered' | 'failed' | 'simulated';
  httpStatus?: number;
  payloadSummary: string;
}

const webhookDeliveryLogs: WebhookDeliveryLog[] = [];

export async function dispatchWebhookEvent(options: WebhookDispatchOptions): Promise<{ success: boolean; id: string }> {
  const { targetUrl, eventType, payload, secret = 'nahalabs_default_dev_hmac_secret_key_v2' } = options;
  const deliveryId = `whd_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  
  const envelope = {
    id: deliveryId,
    event: eventType,
    createdAt: new Date().toISOString(),
    data: payload,
  };

  const { headerValue } = generateHmacV2Signature({
    secret,
    body: envelope,
  });

  let status: WebhookDeliveryLog['status'] = 'simulated';
  let httpStatus: number | undefined = 200;

  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-nahalabs-signature': headerValue,
          'x-nahalabs-event': eventType,
          'x-nahalabs-delivery-id': deliveryId,
        },
        body: JSON.stringify(envelope),
      });
      httpStatus = response.status;
      status = response.ok ? 'delivered' : 'failed';
    } catch (err) {
      console.warn('Webhook dispatch network failure:', err);
      status = 'failed';
      httpStatus = 500;
    }
  }

  const logEntry: WebhookDeliveryLog = {
    id: deliveryId,
    targetUrl,
    eventType,
    timestamp: new Date().toISOString(),
    status,
    httpStatus,
    payloadSummary: JSON.stringify(payload).substring(0, 100) + '...',
  };

  webhookDeliveryLogs.unshift(logEntry);
  if (webhookDeliveryLogs.length > 50) webhookDeliveryLogs.pop();

  return { success: status !== 'failed', id: deliveryId };
}

export function getWebhookLogs(): WebhookDeliveryLog[] {
  return webhookDeliveryLogs;
}
