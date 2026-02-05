-- User feedback system for prediction accuracy tracking
-- Apply with:
--   npx wrangler d1 migrations apply consult-db --local
--   npx wrangler d1 migrations apply consult-db

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  -- Chart identification
  chart_id TEXT NOT NULL,
  
  -- User identification (optional, for anonymous feedback)
  user_hash TEXT, -- SHA256 hash of email/IP for privacy
  
  -- Feedback type
  feedback_type TEXT NOT NULL, -- 'prediction', 'satisfaction', 'accuracy', 'suggestion'
  
  -- Prediction feedback
  prediction_category TEXT, -- 'palace', 'liuyue', 'tactics', 'overall'
  prediction_target TEXT, -- e.g., '命宮', '2026-03', 'career_advice'
  predicted_value TEXT, -- What was predicted
  actual_value TEXT, -- What actually happened (for verification)
  accuracy_rating INTEGER, -- 1-5 stars
  
  -- Satisfaction feedback
  satisfaction_rating INTEGER, -- 1-5 stars
  satisfaction_category TEXT, -- 'ui', 'accuracy', 'usefulness', 'overall'
  
  -- Accuracy verification
  verification_status TEXT, -- 'pending', 'verified', 'disputed'
  verification_date TEXT, -- When the prediction was verified
  
  -- Detailed feedback
  feedback_text TEXT, -- Free-form feedback text
  positive_aspects TEXT, -- What worked well
  negative_aspects TEXT, -- What didn't work
  
  -- Context data
  context_data TEXT, -- JSON string with additional context (bazi, ziwei, etc.)
  
  -- Metadata
  source TEXT, -- 'web', 'mobile', 'api'
  user_agent TEXT,
  ip_hash TEXT -- SHA256 hash of IP for analytics (privacy-preserving)
);

CREATE INDEX IF NOT EXISTS idx_feedback_chart_id ON feedback(chart_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_verification_status ON feedback(verification_status);
CREATE INDEX IF NOT EXISTS idx_feedback_accuracy_rating ON feedback(accuracy_rating);
CREATE INDEX IF NOT EXISTS idx_feedback_satisfaction_rating ON feedback(satisfaction_rating);

-- Analytics view for accuracy tracking
CREATE VIEW IF NOT EXISTS feedback_accuracy_stats AS
SELECT 
  prediction_category,
  AVG(accuracy_rating) as avg_accuracy,
  COUNT(*) as total_feedback,
  SUM(CASE WHEN accuracy_rating >= 4 THEN 1 ELSE 0 END) as positive_count,
  SUM(CASE WHEN accuracy_rating <= 2 THEN 1 ELSE 0 END) as negative_count
FROM feedback
WHERE feedback_type = 'prediction' AND accuracy_rating IS NOT NULL
GROUP BY prediction_category;
