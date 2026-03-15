-- Email logs table for tracking sent emails (for monitoring Resend usage)

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email TEXT NOT NULL,
  from_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  email_type TEXT, -- 'transactional', 'digest', 'notification', 'marketing'
  resend_id TEXT, -- ID from Resend API
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'bounced', 'failed'
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Solo platform admins pueden leer logs
CREATE POLICY "Platform admin read email_logs"
  ON email_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'platform_admin'
    )
  );

-- Sistema puede insertar
CREATE POLICY "System insert email_logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE email_logs IS 'Logs de emails enviados para monitorear cuota de Resend';
COMMENT ON COLUMN email_logs.email_type IS 'Tipo de email: transactional, digest, notification, marketing';
COMMENT ON COLUMN email_logs.resend_id IS 'ID del email en Resend (para tracking)';
COMMENT ON COLUMN email_logs.metadata IS 'Datos adicionales: proyecto_id, user_id, template_id, etc.';
