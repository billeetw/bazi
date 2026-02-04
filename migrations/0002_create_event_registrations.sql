-- Event signups (e.g. 2/13 一起出來玩聚會)
-- Apply with:
--   npx wrangler d1 migrations apply consult-db --local
--   npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  event_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  bank_last5 TEXT NOT NULL,
  tax_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_event_reg_created ON event_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_event_reg_event_slug ON event_registrations(event_slug);
CREATE INDEX IF NOT EXISTS idx_event_reg_email ON event_registrations(email);
