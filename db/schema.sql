-- Core database schema for the platform
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','manager','affiliate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  advertiser TEXT,
  payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  postback_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clicks (
  id UUID PRIMARY KEY,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  sub1 TEXT,
  sub2 TEXT,
  ip TEXT,
  ua TEXT,
  ts TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_clicks_offer ON clicks(offer_id);
CREATE INDEX IF NOT EXISTS idx_clicks_affiliate ON clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_clicks_ts ON clicks(ts);

CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES clicks(id) ON DELETE SET NULL,
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL,
  payout NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('approved','rejected','pending')),
  reason TEXT,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_conversions_offer ON conversions(offer_id);
CREATE INDEX IF NOT EXISTS idx_conversions_affiliate ON conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_conversions_ts ON conversions(ts);

