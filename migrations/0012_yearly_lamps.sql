-- 太歲光明燈：每人每年一筆，記錄點燈狀態與守護語
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS yearly_lamps (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  flow_branch TEXT NOT NULL,
  user_branch TEXT NOT NULL,
  status_type TEXT NOT NULL,
  guardian_phrase TEXT NOT NULL,
  image_url TEXT,
  lit_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, year),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_yearly_lamps_user_year ON yearly_lamps(user_id, year);
