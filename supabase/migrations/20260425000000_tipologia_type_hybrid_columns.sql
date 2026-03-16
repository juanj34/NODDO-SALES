-- Add tipo_tipologia to tipologias (apartamento / casa / lote)
ALTER TABLE tipologias
  ADD COLUMN IF NOT EXISTS tipo_tipologia TEXT DEFAULT NULL;

ALTER TABLE tipologias
  ADD CONSTRAINT tipologias_tipo_tipologia_check
  CHECK (tipo_tipologia IS NULL OR tipo_tipologia IN ('apartamento', 'casa', 'lote'));

-- Add per-type column config to proyectos for hybrid projects
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS inventory_columns_by_type JSONB DEFAULT NULL;

-- Backfill tipo_tipologia from proyecto.tipo_proyecto for existing rows
UPDATE tipologias t
SET tipo_tipologia = CASE
  WHEN p.tipo_proyecto = 'apartamentos' THEN 'apartamento'
  WHEN p.tipo_proyecto = 'casas' THEN 'casa'
  WHEN p.tipo_proyecto = 'lotes' THEN 'lote'
  ELSE NULL
END
FROM proyectos p
WHERE t.proyecto_id = p.id
  AND t.tipo_tipologia IS NULL;
