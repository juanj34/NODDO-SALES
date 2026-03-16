-- Add inventory_columns JSONB to proyectos
-- NULL means "use defaults based on tipo_proyecto"
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS inventory_columns JSONB DEFAULT NULL;

COMMENT ON COLUMN proyectos.inventory_columns IS
  'Per-project inventory column visibility config. NULL = derive from tipo_proyecto defaults.';
