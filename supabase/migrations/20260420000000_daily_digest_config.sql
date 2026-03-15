-- Add daily_digest_enabled to email_report_config
-- Allows each admin to opt in/out of the daily activity digest email

ALTER TABLE email_report_config
  ADD COLUMN IF NOT EXISTS daily_digest_enabled BOOLEAN DEFAULT true;

ALTER TABLE email_report_config
  ADD COLUMN IF NOT EXISTS last_daily_sent TIMESTAMPTZ;

-- Service role needs to read all configs for the cron job
CREATE POLICY "Service role reads all email_report_config"
  ON email_report_config FOR SELECT
  USING (auth.role() = 'service_role');

COMMENT ON COLUMN email_report_config.daily_digest_enabled IS 'Whether the user receives a daily activity digest email';
COMMENT ON COLUMN email_report_config.last_daily_sent IS 'Timestamp of last daily digest sent';
