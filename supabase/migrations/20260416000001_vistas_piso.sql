-- ============================================================
-- Migration: Floor Views (Vistas por Piso) system
-- ============================================================

-- 1. Create vistas_piso table
CREATE TABLE IF NOT EXISTS vistas_piso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  torre_id UUID REFERENCES torres(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  orientacion TEXT,
  piso_min INT,
  piso_max INT,
  tipologia_ids UUID[],
  imagen_url TEXT NOT NULL,
  thumbnail_url TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add vista_piso_id FK to unidades
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS vista_piso_id UUID
  REFERENCES vistas_piso(id) ON DELETE SET NULL;

-- 3. RLS Policies
ALTER TABLE vistas_piso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized select vistas_piso"
  ON vistas_piso FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write vistas_piso"
  ON vistas_piso FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update vistas_piso"
  ON vistas_piso FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete vistas_piso"
  ON vistas_piso FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_vistas_piso_proyecto_id ON vistas_piso(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_vistas_piso_torre_id ON vistas_piso(torre_id);
CREATE INDEX IF NOT EXISTS idx_unidades_vista_piso_id ON unidades(vista_piso_id);

-- 5. Trigger: bump proyecto updated_at
CREATE TRIGGER trg_vistas_piso_bump
  AFTER INSERT OR UPDATE OR DELETE ON vistas_piso
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();
