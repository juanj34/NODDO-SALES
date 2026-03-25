-- Add lead and cotizacion association to unidades for sale tracking
ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cotizacion_id UUID REFERENCES cotizaciones(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_unidades_lead_id ON unidades(lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_unidades_cotizacion_id ON unidades(cotizacion_id) WHERE cotizacion_id IS NOT NULL;

-- Add disponibilidad configuration to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS disponibilidad_config JSONB DEFAULT '{}';
