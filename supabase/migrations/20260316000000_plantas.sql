-- Add floor plan (planta) support to fachadas table
-- tipo: "fachada" (default, existing) or "planta" (floor plan view)
-- piso_numero: which floor this plan represents
-- planta_tipo_nombre: grouping name for batch creation/duplication

ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'fachada';
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS piso_numero INT;
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS planta_tipo_nombre TEXT;
