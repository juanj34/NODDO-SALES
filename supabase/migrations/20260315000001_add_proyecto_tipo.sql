-- Add tipo_proyecto field to proyectos table
-- Determines whether project is for apartments (torres), houses (urbanismos), or both (hibrido)

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS tipo_proyecto TEXT NOT NULL DEFAULT 'hibrido'
  CHECK (tipo_proyecto IN ('apartamentos', 'casas', 'hibrido'));

-- Add comment for clarity
COMMENT ON COLUMN proyectos.tipo_proyecto IS 'Project type: apartamentos (towers), casas (urbanismos), hibrido (both)';

-- Create index for filtering by type (useful for platform analytics)
CREATE INDEX IF NOT EXISTS idx_proyectos_tipo ON proyectos(tipo_proyecto);
