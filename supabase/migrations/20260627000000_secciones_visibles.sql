-- Section visibility configuration for microsites
-- NULL = all sections visible (backwards compatible)
ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS secciones_visibles jsonb DEFAULT NULL;
