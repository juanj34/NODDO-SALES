-- Feature Blocked Emails Tracking
-- Track when we send "feature blocked" emails to avoid spam

CREATE TABLE IF NOT EXISTS feature_blocked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT feature_blocked_emails_user_feature_unique UNIQUE (user_id, feature)
);

-- Index for cleanup queries (delete old records)
CREATE INDEX IF NOT EXISTS idx_feature_blocked_emails_sent_at
  ON feature_blocked_emails(sent_at);

-- RLS Policies
ALTER TABLE feature_blocked_emails ENABLE ROW LEVEL SECURITY;

-- Only service role can read/write (backend only)
CREATE POLICY "Service role full access on feature_blocked_emails"
  ON feature_blocked_emails
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to check if we should send email (and record it)
CREATE OR REPLACE FUNCTION should_send_feature_blocked_email(
  p_user_id UUID,
  p_feature TEXT,
  p_throttle_days INT DEFAULT 7
) RETURNS BOOLEAN AS $$
DECLARE
  v_last_sent TIMESTAMPTZ;
  v_should_send BOOLEAN;
BEGIN
  -- Get last sent timestamp for this user + feature
  SELECT sent_at INTO v_last_sent
  FROM feature_blocked_emails
  WHERE user_id = p_user_id AND feature = p_feature;

  -- Should send if:
  -- 1. Never sent before (v_last_sent IS NULL)
  -- 2. Or last sent was more than p_throttle_days ago
  v_should_send := (
    v_last_sent IS NULL
    OR v_last_sent < NOW() - (p_throttle_days || ' days')::INTERVAL
  );

  -- If should send, upsert record with new timestamp
  IF v_should_send THEN
    INSERT INTO feature_blocked_emails (user_id, feature, sent_at)
    VALUES (p_user_id, p_feature, NOW())
    ON CONFLICT (user_id, feature)
    DO UPDATE SET sent_at = NOW();
  END IF;

  RETURN v_should_send;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup function: delete records older than 90 days (keep table small)
CREATE OR REPLACE FUNCTION cleanup_old_feature_blocked_emails()
RETURNS void AS $$
BEGIN
  DELETE FROM feature_blocked_emails
  WHERE sent_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE feature_blocked_emails IS 'Tracks when feature-blocked emails are sent to prevent spam';
COMMENT ON FUNCTION should_send_feature_blocked_email IS 'Returns true if email should be sent (and records it). Throttles to once per 7 days by default.';
COMMENT ON FUNCTION cleanup_old_feature_blocked_emails IS 'Delete records older than 90 days. Run via cron weekly.';
