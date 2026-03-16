-- ============================================================
-- Multi-tipología support for lots (casas/urbanismo projects)
-- ============================================================

-- 1. Junction table: which tipologías are available per unidad
CREATE TABLE IF NOT EXISTS unidad_tipologias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  tipologia_id UUID NOT NULL REFERENCES tipologias(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(unidad_id, tipologia_id)
);

CREATE INDEX idx_unidad_tipologias_proyecto ON unidad_tipologias(proyecto_id);
CREATE INDEX idx_unidad_tipologias_unidad ON unidad_tipologias(unidad_id);
CREATE INDEX idx_unidad_tipologias_tipologia ON unidad_tipologias(tipologia_id);

-- 2. New columns on unidades for lot-based projects
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS lote TEXT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS etapa_nombre TEXT;

-- 3. Tipología mode on proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS tipologia_mode TEXT NOT NULL DEFAULT 'fija'
  CHECK (tipologia_mode IN ('fija', 'multiple'));

-- 4. RLS policies for unidad_tipologias
ALTER TABLE unidad_tipologias ENABLE ROW LEVEL SECURITY;

-- Public read for published projects
CREATE POLICY "Public read unidad_tipologias"
  ON unidad_tipologias FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE id = proyecto_id AND estado = 'publicado'
  ));

-- Owner + collaborator full access (uses existing is_project_authorized helper)
CREATE POLICY "Authorized access unidad_tipologias"
  ON unidad_tipologias FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND is_project_authorized(p.user_id)
  ));
