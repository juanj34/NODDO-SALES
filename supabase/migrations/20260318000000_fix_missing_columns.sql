-- Fix: These columns were supposed to be added by 20260314000000_implantaciones_enhancements.sql
-- but that migration was recorded as applied without the SQL actually executing.

ALTER TABLE planos_interactivos ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE plano_puntos ADD COLUMN IF NOT EXISTS render_url TEXT;
