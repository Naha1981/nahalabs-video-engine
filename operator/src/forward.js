import { getBindings, claimInboundDelivery, markDeliveryStatus } from './store.js';
import { sign } from './hmac.js';
import { logger } from './logger.js';

/**
 * Inbound fan-out: resolve bindings for a WhatsApp account, claim each delivery
 * idempotently, and POST a signed HMAC-v2 webhook to each app's Core endpoint.
 */
export async function forwardToCore(waAccountId, msg) {
  const messageId = msg.key?.id;
  if (!messageId) {
    logger.warn({ waAccountId }, 'message without id skipped');
    return;
  }

  const bindings = await getBindings(waAccountId);
  if (!bindings.length) {
    logger.warn({ waAccountId }, 'no bindings for account — message dropped');
    return;
  }

  for (const binding of bindings) {
    const claimed = await claimInboundDelivery(binding, messageId);
    if (!claimed) continue; // already delivered to this app/tenant

    const payload = JSON.stringify({
      waAccountId,
      tenantId: binding.tenant_id,
      appId: binding.app_id,
      message: msg,
    });

    try {
      const { signature, timestamp, nonce } = sign(payload, process.env.WEBHOOK_SECRET);
      const res = await fetch(binding.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Signature': signature,
          'X-Timestamp': timestamp,
          'X-Nonce': nonce,
        },
        body: payload,
      });
      await markDeliveryStatus(binding, messageId, res.ok ? 'delivered' : 'failed');
      if (!res.ok) {
        logger.warn({ waAccountId, tenantId: binding.tenant_id, status: res.status }, 'core webhook rejected');
      }
    } catch (err) {
      logger.error({ err, waAccountId, tenantId: binding.tenant_id }, 'core webhook delivery failed');
      await markDeliveryStatus(binding, messageId, 'failed').catch(() => {});
    }
  }
}
