-- Add torre_id to unidades for multi-tower support
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS torre_id UUID REFERENCES torres(id) ON DELETE SET NULL;
