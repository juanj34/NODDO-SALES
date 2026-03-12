-- Add optional torre_id to galeria_categorias for tower-scoped galleries
-- NULL = project-wide ("General"), set = tower-specific
-- Same pattern as fachadas, unidades, plano_puntos
ALTER TABLE galeria_categorias
  ADD COLUMN IF NOT EXISTS torre_id UUID REFERENCES torres(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_galeria_categorias_torre_id
  ON galeria_categorias(torre_id);
