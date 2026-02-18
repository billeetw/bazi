-- 占卦紀錄：問題、卦象、時戳（MVP 階段可匿名）
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS divination_logs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,

  -- 關聯（未來可選填）
  user_id TEXT,

  -- 問題與情緒
  question TEXT NOT NULL,
  mood TEXT,

  -- 卦象
  primary_index INTEGER NOT NULL,
  transformed_index INTEGER NOT NULL,
  mutual_index INTEGER NOT NULL,
  lines_json TEXT NOT NULL,
  changing_lines_json TEXT,

  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_divination_created ON divination_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_divination_user ON divination_logs(user_id);
