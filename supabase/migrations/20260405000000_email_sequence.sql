-- Pre-call email sequence tracking for show rate optimization
-- Adds adaptive sequence plan + visit tracking to appointments table

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS sequence_plan JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sequence_emails_sent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS thank_you_page_visited BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS thank_you_page_visited_at TIMESTAMPTZ;

-- Index for cron job: find confirmed appointments with pending sequence emails
CREATE INDEX IF NOT EXISTS idx_appointments_sequence
  ON appointments (scheduled_for)
  WHERE status = 'confirmed' AND sequence_emails_sent < 6;

COMMENT ON COLUMN appointments.sequence_plan IS 'JSONB array of {email, send_at, sent, sent_at} — computed at booking time based on hours until call';
COMMENT ON COLUMN appointments.sequence_emails_sent IS 'Counter of sequence emails sent (0-6)';
