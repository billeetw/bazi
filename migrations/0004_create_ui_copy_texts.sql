-- UI Copy Texts Management Table
-- Apply with:
--   npx wrangler d1 migrations apply consult-db --local
--   npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS ui_copy_texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  copy_key TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'zh-TW',
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(copy_key, locale)
);

CREATE INDEX IF NOT EXISTS idx_ui_copy_texts_copy_key ON ui_copy_texts(copy_key);
CREATE INDEX IF NOT EXISTS idx_ui_copy_texts_locale ON ui_copy_texts(locale);
CREATE INDEX IF NOT EXISTS idx_ui_copy_texts_category ON ui_copy_texts(category);
CREATE INDEX IF NOT EXISTS idx_ui_copy_texts_updated_at ON ui_copy_texts(updated_at);
