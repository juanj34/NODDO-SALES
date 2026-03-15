-- Tabla de configuración de reportes por email
-- Almacena preferencias de cada usuario para recibir reportes automáticos semanales/mensuales

CREATE TABLE email_report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Preferencias de reportes
  weekly_enabled BOOLEAN DEFAULT true,
  monthly_enabled BOOLEAN DEFAULT true,

  -- Filtros: qué proyectos incluir (NULL = todos)
  project_ids UUID[] DEFAULT NULL,

  -- Configuración de entrega
  email_override TEXT, -- Si es diferente del email del usuario
  timezone TEXT DEFAULT 'America/Bogota',

  -- Timestamps de último envío (para tracking)
  last_weekly_sent TIMESTAMPTZ,
  last_monthly_sent TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE email_report_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own email_report_config"
  ON email_report_config FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_report_config_user ON email_report_config(user_id);

COMMENT ON TABLE email_report_config IS 'User preferences for automated email reports (weekly/monthly)';

-- Cron jobs para envío automático de reportes
-- Requiere pg_cron y pg_net extensions (ya habilitadas en proyectos Supabase)

-- Reporte semanal: cada lunes a las 9 AM hora Bogotá (14:00 UTC)
SELECT cron.schedule(
  'email-reports-weekly',
  '0 14 * * 1', -- Cron: minuto hora día mes día-semana (1=lunes)
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/email-reports?type=weekly',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Reporte mensual: primer día del mes a las 9 AM hora Bogotá (14:00 UTC)
SELECT cron.schedule(
  'email-reports-monthly',
  '0 14 1 * *', -- Cron: día 1 de cada mes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/email-reports?type=monthly',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
