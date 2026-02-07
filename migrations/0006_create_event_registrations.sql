-- 活動報名（2/13 等）獨立表
-- Apply: npx wrangler d1 migrations apply consult-db --remote
--       npx wrangler d1 migrations apply consult-db --local

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

CREATE INDEX IF NOT EXISTS idx_event_registrations_created_at ON event_registrations(created_at);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_slug ON event_registrations(event_slug);
