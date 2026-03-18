-- Add 'proximamente' to unidad_state_history CHECK constraints
-- The trigger unidad_state_change_trigger fires on UPDATE to unidades.estado
-- and inserts into this table. Without 'proximamente' in the CHECK, all
-- estado changes to 'proximamente' fail silently.

ALTER TABLE unidad_state_history
  DROP CONSTRAINT IF EXISTS unidad_state_history_estado_anterior_check,
  DROP CONSTRAINT IF EXISTS unidad_state_history_estado_nuevo_check;

ALTER TABLE unidad_state_history
  ADD CONSTRAINT unidad_state_history_estado_anterior_check
    CHECK (estado_anterior IN ('disponible', 'separado', 'reservada', 'vendida', 'proximamente')),
  ADD CONSTRAINT unidad_state_history_estado_nuevo_check
    CHECK (estado_nuevo IN ('disponible', 'separado', 'reservada', 'vendida', 'proximamente'));
