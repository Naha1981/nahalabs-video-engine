import crypto from 'crypto';
import { pool } from '../db/client.js';

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'nahalabs-super-secret-webhook-key';

export async function forwardToMain(waAccountId, msg) {
  try {
    const bindingRes = await pool.query(
      'SELECT webhook_url, tenant_id, app_id FROM wa_account_bindings WHERE wa_account_id = $1 LIMIT 1',
      [waAccountId]
    );

    if (!bindingRes.rows.length) {
      console.warn(`[Operator] No webhook binding found for wa_account_id: ${waAccountId}`);
      return;
    }

    const { webhook_url, tenant_id, app_id } = bindingRes.rows[0];

    const payload = {
      waAccountId,
      tenantId: tenant_id,
      appId: app_id,
      timestamp: Date.now(),
      message: msg,
    };

    const rawBody = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
      },
      body: rawBody,
    });

    if (!response.ok) {
      console.error(`[Operator] Webhook delivery failed for ${app_id} (Tenant ${tenant_id}): HTTP ${response.status}`);
    } else {
      console.log(`[Operator] Forwarded message for ${waAccountId} to ${app_id}`);
    }
  } catch (err) {
    console.error('[Operator] Error forwarding webhook to main app:', err);
  }
}
