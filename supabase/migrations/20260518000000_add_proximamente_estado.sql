-- Add 'proximamente' to unidades.estado allowed values
-- This allows marking units as "Coming Soon" in addition to the existing states

ALTER TABLE unidades DROP CONSTRAINT IF EXISTS unidades_estado_check;

ALTER TABLE unidades ADD CONSTRAINT unidades_estado_check
  CHECK (estado IN ('disponible', 'separado', 'reservada', 'vendida', 'proximamente'));
