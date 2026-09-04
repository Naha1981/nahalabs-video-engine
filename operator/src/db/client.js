import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initOperatorDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_sessions (
      wa_account_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (wa_account_id, key)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wa_account_bindings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      wa_account_id TEXT NOT NULL,
      app_id TEXT NOT NULL,
      tenant_id TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('Operator database tables initialized successfully.');
}

export async function getCreds(waAccountId) {
  const res = await pool.query(
    'SELECT value FROM wa_sessions WHERE wa_account_id = $1 AND key = $2',
    [waAccountId, 'creds']
  );
  return res.rows[0]?.value || null;
}

export async function saveCreds(waAccountId, credsValue) {
  await pool.query(
    `INSERT INTO wa_sessions (wa_account_id, key, value) 
     VALUES ($1, $2, $3) 
     ON CONFLICT (wa_account_id, key) 
     DO UPDATE SET value = EXCLUDED.value`,
    [waAccountId, 'creds', credsValue]
  );
}

export async function updateWaAccount(waAccountId, statusObj) {
  // Can log or update status in main app / operator state
  console.log(`[Account ${waAccountId}] Status update:`, statusObj);
}
