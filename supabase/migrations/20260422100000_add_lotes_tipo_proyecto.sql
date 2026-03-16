-- Add "lotes" to tipo_proyecto enum
ALTER TABLE proyectos DROP CONSTRAINT IF EXISTS proyectos_tipo_proyecto_check;
ALTER TABLE proyectos ADD CONSTRAINT proyectos_tipo_proyecto_check
  CHECK (tipo_proyecto IN ('apartamentos', 'casas', 'hibrido', 'lotes'));
