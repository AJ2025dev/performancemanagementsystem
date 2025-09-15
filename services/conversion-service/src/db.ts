import { Pool } from 'pg';

const {
  POSTGRES_HOST = 'localhost',
  POSTGRES_PORT = '5432',
  POSTGRES_DB = 'affnet',
  POSTGRES_USER = 'affnet',
  POSTGRES_PASSWORD = 'affnetpass'
} = process.env;

export const pool = new Pool({
  host: POSTGRES_HOST,
  port: Number(POSTGRES_PORT),
  database: POSTGRES_DB,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
});

export async function initSchema() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS clicks (
      id UUID PRIMARY KEY,
      offer_id TEXT,
      affiliate_id TEXT,
      sub1 TEXT,
      sub2 TEXT,
      ip TEXT,
      ua TEXT,
      ts TIMESTAMPTZ NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      click_id UUID,
      offer_id TEXT,
      affiliate_id TEXT,
      payout NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK (status IN ('approved','rejected','pending')),
      reason TEXT,
      ts TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON conversions(affiliate_id);
    CREATE INDEX IF NOT EXISTS idx_conversions_offer ON conversions(offer_id);
  `);
}

