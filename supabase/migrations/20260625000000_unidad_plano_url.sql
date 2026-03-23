-- Add per-unit floor plan URL (for commercial locales or unique units)
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS plano_url TEXT DEFAULT NULL;
