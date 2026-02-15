-- 時辰推算 vNext：置信度、top2、貢獻度、回饋擴充
-- Apply: npx wrangler d1 migrations apply consult-db --local
--       npx wrangler d1 migrations apply consult-db --remote

ALTER TABLE estimate_hour_logs ADD COLUMN confidence_score INTEGER;
ALTER TABLE estimate_hour_logs ADD COLUMN best_score REAL;
ALTER TABLE estimate_hour_logs ADD COLUMN second_score REAL;
ALTER TABLE estimate_hour_logs ADD COLUMN delta REAL;
ALTER TABLE estimate_hour_logs ADD COLUMN top2_branches TEXT;
ALTER TABLE estimate_hour_logs ADD COLUMN flags_json TEXT;
ALTER TABLE estimate_hour_logs ADD COLUMN contributions_json TEXT;
ALTER TABLE estimate_hour_logs ADD COLUMN is_partial_correct INTEGER;
ALTER TABLE estimate_hour_logs ADD COLUMN weight_adjustment_suggestion TEXT;
