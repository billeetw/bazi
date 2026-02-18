-- 使用統計（每次命盤計算成功時記錄，含未登入用戶）
-- 供年齡、性別、語言、地區分析
-- Apply: npx wrangler d1 migrations apply consult-db --remote

CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  session_id TEXT,
  birth_year INTEGER,
  gender TEXT,
  language TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  country TEXT,
  region TEXT,
  ip_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_usage_created ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_year_gender ON usage_logs(birth_year, gender);
CREATE INDEX IF NOT EXISTS idx_usage_language ON usage_logs(language);
