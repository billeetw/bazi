-- 占卦回饋：準確度與建議
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db

ALTER TABLE divination_logs ADD COLUMN feedback_rating TEXT;
ALTER TABLE divination_logs ADD COLUMN feedback_text TEXT;
ALTER TABLE divination_logs ADD COLUMN feedback_at TEXT;

CREATE INDEX IF NOT EXISTS idx_divination_feedback ON divination_logs(feedback_rating);
