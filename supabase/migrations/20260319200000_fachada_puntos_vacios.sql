-- Add puntos_vacios column to fachadas table
-- Stores unassigned dot positions as JSON array: [{x: number, y: number}, ...]
-- These dots are visible only in the dashboard editor, never on the public microsite
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS puntos_vacios JSONB DEFAULT '[]'::jsonb;
