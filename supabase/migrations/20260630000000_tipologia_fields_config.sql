-- Add tipologia_fields JSONB column for controlling which tipología spec fields
-- are visible in the editor form, microsite detail panels, and cotizador.
-- Separate from inventory_columns which controls unit LIST views.
-- When NULL, defaults are derived from tipo_proyecto.

ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS tipologia_fields jsonb DEFAULT NULL;
