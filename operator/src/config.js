import dotenv from 'dotenv';
dotenv.config();

const REQUIRED = ['DATABASE_URL', 'WEBHOOK_SECRET', 'OPERATOR_API_KEY'];

export const config = {
  PORT: Number(process.env.PORT || 10000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DATABASE_URL: process.env.DATABASE_URL,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  OPERATOR_API_KEY: process.env.OPERATOR_API_KEY,
  PAIRING_QR_TTL_SECONDS: Number(process.env.PAIRING_QR_TTL_SECONDS || 120),
};

/** Fail closed: refuse to start if required configuration is missing. */
export function validateConfig() {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length) {
    const message = `Missing required environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill them in.';
    console.error(message);
    throw new Error(message);
  }
}
