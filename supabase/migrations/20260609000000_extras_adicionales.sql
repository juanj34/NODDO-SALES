-- 8 new tipología-level extras
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_bbq BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_terraza BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_jardin BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_cuarto_servicio BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_estudio BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_chimenea BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_doble_altura BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_rooftop BOOLEAN DEFAULT false;

-- 8 new project-level enablement flags
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_bbq BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_terraza BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_jardin BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_cuarto_servicio BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_estudio BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_chimenea BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_doble_altura BOOLEAN DEFAULT false;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS habilitar_extra_rooftop BOOLEAN DEFAULT false;
