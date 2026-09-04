import express from 'express';
import pinoHttp from 'pino-http';
import { z } from 'zod';
import { config, validateConfig } from './config.js';
import { logger } from './logger.js';
import { initDb, ping, getAccount, closePool } from './store.js';
import {
  startWhatsAppSocket,
  stopWhatsAppSocket,
  stopAll,
  sendMessage,
  getPairingQr,
  isSocketConnected,
} from './transport.js';
import { constantTimeEqual } from './hmac.js';

const app = express();
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const uuidSchema = z.string().uuid();
const sendSchema = z.object({
  waAccountId: z.string().uuid(),
  to: z.string().min(1).max(64),
  text: z.string().min(1).max(4096),
});

/** Fail-closed API-key auth for every mutating/introspecting route. */
function requireApiKey(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !constantTimeEqual(token, config.OPERATOR_API_KEY)) {
    return res.status(401).json({ error: 'UNAUTHORIZED', code: 'UNAUTHORIZED' });
  }
  next();
}

// Liveness — keep-alive scheduler hits this.
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nahalabs-whatsapp-operator',
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Readiness — can this service actually do its job?
app.get('/ready', asyncHandler(async (req, res) => {
  try {
    await ping();
    res.json({ status: 'ok', ready: true, database: 'up' });
  } catch (err) {
    logger.error({ err }, 'readiness failed');
    res.status(503).json({ status: 'error', ready: false, database: 'down' });
  }
}));

// Start pairing → the owner scans the ephemeral QR returned by GET /accounts/:id/qr.
app.post('/accounts/:id/pair', requireApiKey, asyncHandler(async (req, res) => {
  const parsed = uuidSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_ACCOUNT_ID', code: 'INVALID_ACCOUNT_ID' });
  const result = await startWhatsAppSocket(parsed.data);
  res.status(202).json({ pairingStarted: true, ...result });
}));

// Ephemeral pairing QR (memory + TTL, never persisted).
app.get('/accounts/:id/qr', requireApiKey, asyncHandler(async (req, res) => {
  const parsed = uuidSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_ACCOUNT_ID', code: 'INVALID_ACCOUNT_ID' });
  const qr = getPairingQr(parsed.data);
  if (!qr) return res.status(410).json({ error: 'QR_EXPIRED', code: 'QR_EXPIRED' });
  res.json({ qr });
}));

app.get('/accounts/:id/status', requireApiKey, asyncHandler(async (req, res) => {
  const parsed = uuidSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_ACCOUNT_ID', code: 'INVALID_ACCOUNT_ID' });
  const account = await getAccount(parsed.data);
  res.json({
    waAccountId: parsed.data,
    isConnected: isSocketConnected(parsed.data) && Boolean(account?.is_connected),
    phoneNumber: account?.phone_number ?? null,
  });
}));

app.post('/accounts/:id/disconnect', requireApiKey, asyncHandler(async (req, res) => {
  const parsed = uuidSchema.safeParse(req.params.id);
  if (!parsed.success) return res.status(400).json({ error: 'INVALID_ACCOUNT_ID', code: 'INVALID_ACCOUNT_ID' });
  await stopWhatsAppSocket(parsed.data);
  res.json({ disconnected: true });
}));

// Send a message. Idempotency is enforced at the Core outbox layer.
app.post('/send', requireApiKey, asyncHandler(async (req, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', code: 'VALIDATION_ERROR', issues: parsed.error.issues });
  }
  const { waAccountId, to, text } = parsed.data;
  const result = await sendMessage(waAccountId, to, text);
  res.json({ sent: true, result });
}));

app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', code: 'NOT_FOUND' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'INTERNAL_ERROR', code: 'INTERNAL_ERROR' });
});

async function shutdown(signal) {
  logger.info({ signal }, 'shutdown initiated');
  try { await stopAll(); } catch (err) { logger.error({ err }, 'stopAll failed'); }
  try { await closePool(); } catch (err) { logger.error({ err }, 'closePool failed'); }
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

async function main() {
  try {
    validateConfig();
  } catch (err) {
    logger.error({ err }, 'configuration invalid');
    process.exit(1);
  }
  await initDb();
  const server = app.listen(config.PORT, '0.0.0.0', () => {
    logger.info(`nahalabs-whatsapp-operator listening on :${config.PORT}`);
  });
  server.keepAliveTimeout = 65_000;
}

main().catch((err) => {
  logger.error({ err }, 'startup failed');
  process.exit(1);
});
