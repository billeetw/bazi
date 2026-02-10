-- 登入使用者（OAuth 辨識）與「我的命盤」（每人最多 5 筆，由 API 限制）
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_user_id TEXT NOT NULL,
  email TEXT,
  name TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(provider, provider_user_id)
);

CREATE INDEX IF NOT EXISTS idx_users_provider_uid ON users(provider, provider_user_id);

CREATE TABLE IF NOT EXISTS user_charts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  birth_time TEXT NOT NULL,
  gender TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_charts_user_id ON user_charts(user_id);
