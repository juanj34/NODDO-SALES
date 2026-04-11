-- Extend ai_usage_logs with real token counts from Gemini API
-- Previously only tracked input_length/output_length (character counts)

ALTER TABLE ai_usage_logs
  ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS completion_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS total_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS cost_usd NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'gemini-2.5-pro',
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Index for abuse detection (tokens per user per day)
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_tokens
  ON ai_usage_logs(user_id, created_at DESC)
  WHERE total_tokens IS NOT NULL;

-- Index for feature breakdown
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature
  ON ai_usage_logs(feature);
