-- Composite index for efficient cotizaciones counting per lead (email + proyecto_id lookup)
CREATE INDEX IF NOT EXISTS idx_cotizaciones_email_proyecto
  ON cotizaciones(email, proyecto_id);

-- Index for date range filtering on leads
CREATE INDEX IF NOT EXISTS idx_leads_created_at
  ON leads(created_at);
