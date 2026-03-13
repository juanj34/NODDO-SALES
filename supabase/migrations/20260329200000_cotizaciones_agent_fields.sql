-- Add agent tracking fields to cotizaciones table.
-- Records which user (sales agent) generated each quote.

ALTER TABLE cotizaciones
  ADD COLUMN IF NOT EXISTS agente_id UUID,
  ADD COLUMN IF NOT EXISTS agente_nombre TEXT;
