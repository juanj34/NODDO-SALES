-- Custom inventory columns: per-project column definitions + per-unit field values
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS custom_columns JSONB DEFAULT '[]';
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
