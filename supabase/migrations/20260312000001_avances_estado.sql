-- Add estado (draft/published) to avances_obra for per-avance visibility control
ALTER TABLE avances_obra
  ADD COLUMN estado TEXT DEFAULT 'borrador'
  CHECK (estado IN ('borrador', 'publicado'));

-- Set all existing avances as published (they were already visible)
UPDATE avances_obra SET estado = 'publicado';
