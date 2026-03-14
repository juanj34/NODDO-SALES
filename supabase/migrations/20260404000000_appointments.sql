-- ─── Appointments table for NODDO demo booking automation ───
-- Tracks GHL appointments locally for email reminders, no-show handling, and analytics.

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  empresa TEXT,
  whatsapp_optin BOOLEAN DEFAULT false,

  -- Appointment
  ghl_appointment_id TEXT NOT NULL,
  ghl_contact_id TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  timezone TEXT DEFAULT 'America/Bogota',
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'confirmed', 'attended', 'no_show', 'cancelled', 'rescheduled'
  )),

  -- Attribution
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  referrer TEXT,
  visitor_id TEXT,

  -- Reminders tracking
  reminder_24h_sent BOOLEAN DEFAULT false,
  reminder_2h_sent BOOLEAN DEFAULT false,
  reminder_wa_sent BOOLEAN DEFAULT false,
  confirmation_email_sent BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false,

  -- No-show handling
  no_show_count INT DEFAULT 0,
  no_show_followup_sent BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_appointments_email ON appointments(email);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_for);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_reminders ON appointments(scheduled_for)
  WHERE status = 'confirmed' AND (reminder_24h_sent = false OR reminder_2h_sent = false);

-- RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Edge functions use service_role key, so RLS is bypassed.
-- Platform admins can read via authenticated queries.
CREATE POLICY "Platform admin read appointments"
  ON appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
  ));

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- Summary stats RPC for dashboard
CREATE OR REPLACE FUNCTION appointments_summary()
RETURNS TABLE (
  total_appointments BIGINT,
  confirmed BIGINT,
  attended BIGINT,
  no_shows BIGINT,
  cancelled BIGINT,
  this_week BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_appointments,
    COUNT(*) FILTER (WHERE a.status = 'confirmed')::BIGINT AS confirmed,
    COUNT(*) FILTER (WHERE a.status = 'attended')::BIGINT AS attended,
    COUNT(*) FILTER (WHERE a.status = 'no_show')::BIGINT AS no_shows,
    COUNT(*) FILTER (WHERE a.status = 'cancelled')::BIGINT AS cancelled,
    COUNT(*) FILTER (WHERE a.scheduled_for >= date_trunc('week', now()))::BIGINT AS this_week,
    CASE
      WHEN COUNT(*) FILTER (WHERE a.status IN ('attended', 'no_show')) > 0
      THEN ROUND(
        COUNT(*) FILTER (WHERE a.status = 'attended')::NUMERIC /
        COUNT(*) FILTER (WHERE a.status IN ('attended', 'no_show'))::NUMERIC * 100,
        1
      )
      ELSE 0
    END AS attendance_rate
  FROM appointments a;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
