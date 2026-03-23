-- Add 'local_comercial' to tipo_tipologia CHECK constraint
ALTER TABLE tipologias DROP CONSTRAINT IF EXISTS tipologias_tipo_tipologia_check;
ALTER TABLE tipologias ADD CONSTRAINT tipologias_tipo_tipologia_check
  CHECK (tipo_tipologia IS NULL OR tipo_tipologia IN ('apartamento', 'casa', 'lote', 'local_comercial'));
