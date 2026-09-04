import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { getCreds, saveCreds, updateWaAccount } from '../db/client.js';
import { forwardToMain } from '../webhook/forward.js';
import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const sockets = new Map();

export async function startWhatsAppSocket(waAccountId) {
  if (sockets.has(waAccountId)) {
    return { success: true, message: 'Socket already active' };
  }

  const savedCredsStr = await getCreds(waAccountId);
  let creds = undefined;
  if (savedCredsStr) {
    try {
      creds = JSON.parse(savedCredsStr);
    } catch (e) {
      logger.error(`Failed to parse saved creds for ${waAccountId}`);
    }
  }

  const authState = {
    state: {
      creds: creds || undefined,
      keys: {
        get: async () => ({}),
        set: async () => {},
      },
    },
    saveCreds: async (newCreds) => {
      await saveCreds(waAccountId, JSON.stringify(newCreds));
    },
  };

  const sock = makeWASocket({
    auth: authState.state,
    printQRInTerminal: true,
    browser: ['NahaLabs Business', 'Chrome', '122.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    logger,
  });

  sockets.set(waAccountId, sock);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      await updateWaAccount(waAccountId, { qrCode: qr, isConnected: false });
      logger.info(`[${waAccountId}] QR Code generated. Scan with WhatsApp.`);
    }

    if (connection === 'open') {
      logger.info(`[${waAccountId}] WhatsApp connected successfully!`);
      await updateWaAccount(waAccountId, {
        isConnected: true,
        qrCode: null,
        phoneNumber: sock.user?.id?.split(':')[0],
      });
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(`[${waAccountId}] Connection closed. Reconnect: ${shouldReconnect}, Code: ${statusCode}`);

      if (shouldReconnect) {
        sockets.delete(waAccountId);
        setTimeout(() => startWhatsAppSocket(waAccountId), 5000);
      } else {
        await updateWaAccount(waAccountId, { isConnected: false });
        sockets.delete(waAccountId);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return; // Ignore outbound echoes

    await forwardToMain(waAccountId, msg);
  });

  sock.ev.on('creds.update', authState.saveCreds);

  return { success: true, message: 'Socket initialization triggered' };
}

export async function sendMessage(waAccountId, to, text) {
  const sock = sockets.get(waAccountId);
  if (!sock) {
    throw new Error(`Socket not initialized or disconnected for account: ${waAccountId}`);
  }

  const jid = to.includes('@s.whatsapp.net') || to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;
  const result = await sock.sendMessage(jid, { text });
  return result;
}

export function getConnectedAccounts() {
  return Array.from(sockets.keys());
}
