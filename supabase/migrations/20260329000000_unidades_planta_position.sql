-- Add separate positioning columns for plantas (floor plans).
-- A unit can now have independent positions on a fachada AND a planta.
-- fachada_id/fachada_x/fachada_y = position on facade elevation
-- planta_id/planta_x/planta_y   = position on floor plan

ALTER TABLE unidades
  ADD COLUMN IF NOT EXISTS planta_id UUID REFERENCES fachadas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS planta_x  FLOAT,
  ADD COLUMN IF NOT EXISTS planta_y  FLOAT;

CREATE INDEX IF NOT EXISTS idx_unidades_planta_id ON unidades(planta_id);
