-- Add location map image URL to proyectos
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS mapa_ubicacion_url TEXT DEFAULT NULL;
