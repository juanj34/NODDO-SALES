-- Project-level config: enable/disable extras toggles for tipologías
-- When enabled, tipologías in this project can have the corresponding boolean set
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_jacuzzi BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_piscina BOOLEAN DEFAULT false;
