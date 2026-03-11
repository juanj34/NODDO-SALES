-- Add building composition fields to torres
ALTER TABLE torres
  ADD COLUMN IF NOT EXISTS pisos_sotano INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pisos_planta_baja INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pisos_podio INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pisos_residenciales INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pisos_rooftop INT DEFAULT NULL;
