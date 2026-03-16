-- Add pricing source configuration to proyectos
-- "unidad" = each unit has its own price (default, current behavior)
-- "tipologia" = all units of a tipologia share the tipologia's precio_desde as the price

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS precio_source TEXT DEFAULT 'unidad';

ALTER TABLE proyectos
  ADD CONSTRAINT proyectos_precio_source_check
  CHECK (precio_source IN ('unidad', 'tipologia'));
