-- Weekly digest email configuration
ALTER TABLE email_report_config ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN DEFAULT true;
ALTER TABLE email_report_config ADD COLUMN IF NOT EXISTS last_weekly_sent TIMESTAMPTZ;
