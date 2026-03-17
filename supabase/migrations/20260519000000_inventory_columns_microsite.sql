-- Add separate inventory column configs for microsite vs editor
-- Migration: 20260519000000_inventory_columns_microsite.sql

-- Add new columns for microsite-specific inventory column configuration
ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS inventory_columns_microsite jsonb,
ADD COLUMN IF NOT EXISTS inventory_columns_microsite_by_type jsonb;

-- Add comments for clarity
COMMENT ON COLUMN proyectos.inventory_columns IS 'Column visibility config for editor/dashboard view';
COMMENT ON COLUMN proyectos.inventory_columns_by_type IS 'Column visibility config for editor/dashboard view (per tipo_tipologia for hybrid projects)';
COMMENT ON COLUMN proyectos.inventory_columns_microsite IS 'Column visibility config for public microsite view';
COMMENT ON COLUMN proyectos.inventory_columns_microsite_by_type IS 'Column visibility config for public microsite view (per tipo_tipologia for hybrid projects)';
