import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initOperatorDb } from './db/client.js';
import { startWhatsAppSocket, sendMessage, getConnectedAccounts } from './whatsapp/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const OPERATOR_API_KEY = process.env.OPERATOR_API_KEY || 'nahalabs-operator-secure-key';

app.use(cors());
app.use(express.json());

// Auth middleware for outbound requests from Main App
function verifyOperatorKey(req, res, next) {
  const apiKey = req.headers['x-operator-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!apiKey || apiKey !== OPERATOR_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid Operator API Key' });
  }
  next();
}

// Health check endpoint (Render / Uptime monitor)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nahalabs-whatsapp-operator',
    environment: process.env.NODE_ENV || 'production',
    activeSockets: getConnectedAccounts().length,
    timestamp: new Date().toISOString(),
  });
});

// Initialize socket & QR code generation for a business tenant
app.post('/api/init', verifyOperatorKey, async (req, res) => {
  try {
    const { waAccountId } = req.body;
    if (!waAccountId) {
      return res.status(400).json({ error: 'Missing waAccountId' });
    }

    const result = await startWhatsAppSocket(waAccountId);
    res.json(result);
  } catch (err) {
    console.error('Error initializing WhatsApp socket:', err);
    res.status(500).json({ error: err.message });
  }
});

// Outbound message sender called by Main App outbox dispatcher
app.post('/api/send', verifyOperatorKey, async (req, res) => {
  try {
    const { waAccountId, to, text } = req.body;
    if (!waAccountId || !to || !text) {
      return res.status(400).json({ error: 'Missing required fields: waAccountId, to, text' });
    }

    const result = await sendMessage(waAccountId, to, text);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Error sending WhatsApp message:', err);
    res.status(500).json({ error: err.message });
  }
});

// List active accounts
app.get('/api/accounts', verifyOperatorKey, (req, res) => {
  res.json({ accounts: getConnectedAccounts() });
});

async function startServer() {
  try {
    await initOperatorDb();
    app.listen(PORT, () => {
      console.log(`NahaLabs WhatsApp Operator running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start WhatsApp Operator server:', err);
    process.exit(1);
  }
}

startServer();
