-- Add activity_id to consultations for 諮詢報名 / 聚會活動 等區分
-- activity_id: NULL 或 'consultation' = 諮詢報名, 'activity-213' = 2/13 聚會活動

ALTER TABLE consultations ADD COLUMN activity_id TEXT;
CREATE INDEX IF NOT EXISTS idx_consultations_activity_id ON consultations(activity_id);
