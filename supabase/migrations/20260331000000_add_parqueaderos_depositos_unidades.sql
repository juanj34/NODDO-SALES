-- Add parqueaderos and depositos columns to unidades table
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS parqueaderos integer;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS depositos integer;
