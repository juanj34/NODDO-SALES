-- Add description to planos_interactivos
ALTER TABLE planos_interactivos ADD COLUMN IF NOT EXISTS descripcion TEXT;

-- Add render_url to plano_puntos for hotspot renders
ALTER TABLE plano_puntos ADD COLUMN IF NOT EXISTS render_url TEXT;
