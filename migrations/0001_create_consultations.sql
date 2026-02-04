-- D1 schema for consultation signups
-- Apply with:
--   npx wrangler d1 migrations apply consult-db --local
--   npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS consultations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  tax_id TEXT,

  birth_info TEXT NOT NULL,
  topics TEXT NOT NULL,
  topic_extra TEXT,
  bank_last5 TEXT NOT NULL,

  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  source TEXT
);

CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);
CREATE INDEX IF NOT EXISTS idx_consultations_email ON consultations(email);
