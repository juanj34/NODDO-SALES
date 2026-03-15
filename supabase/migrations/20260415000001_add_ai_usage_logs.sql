-- AI Usage Analytics Table
-- Tracks all AI text improvement requests for cost monitoring and usage patterns

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,        -- 'improve-text'
  style TEXT,                   -- 'expandir', 'resumir', 'tono_premium', 'corregir'
  input_length INT NOT NULL,
  output_length INT NOT NULL,
  cached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast queries by user and date
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_date
  ON ai_usage_logs(user_id, created_at DESC);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at
  ON ai_usage_logs(created_at DESC);

-- RLS: Users can only view own logs
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI usage"
  ON ai_usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admin policy: Can view all logs (for analytics dashboard)
CREATE POLICY "Admins can view all AI usage"
  ON ai_usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Insert policy: Service role only (API endpoint inserts)
CREATE POLICY "Service can insert AI usage logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (true);
