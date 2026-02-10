-- 推算時辰使用紀錄與用戶回饋（供專家後台分析與模型修正）
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db --remote

CREATE TABLE IF NOT EXISTS estimate_hour_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    answers_json TEXT NOT NULL,
    estimated_branch TEXT NOT NULL,
    estimated_half TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    feedback_correct INTEGER,
    feedback_actual_branch TEXT,
    feedback_actual_half TEXT,
    feedback_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_date ON estimate_hour_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_logs_feedback ON estimate_hour_logs(feedback_correct);
