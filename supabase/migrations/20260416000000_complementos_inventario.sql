-- ============================================================
-- Migration: Parking & Storage Separate Inventory (Complementos)
-- ============================================================

-- 1. Add mode setting to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS complementos_mode TEXT DEFAULT 'incluido'
    CHECK (complementos_mode IN ('incluido', 'separado'));

-- 2. Create complementos table
CREATE TABLE IF NOT EXISTS complementos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  torre_id UUID REFERENCES torres(id) ON DELETE SET NULL,
  unidad_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('parqueadero', 'deposito')),
  subtipo TEXT,
  identificador TEXT NOT NULL,
  nivel TEXT,
  area_m2 FLOAT,
  precio DECIMAL,
  estado TEXT DEFAULT 'disponible'
    CHECK (estado IN ('disponible', 'separado', 'reservada', 'vendida')),
  notas TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Policies (matching colaboradores pattern)
ALTER TABLE complementos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized select complementos"
  ON complementos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write complementos"
  ON complementos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update complementos"
  ON complementos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete complementos"
  ON complementos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_complementos_proyecto_id ON complementos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_complementos_unidad_id ON complementos(unidad_id);
CREATE INDEX IF NOT EXISTS idx_complementos_torre_id ON complementos(torre_id);
CREATE INDEX IF NOT EXISTS idx_complementos_proyecto_tipo ON complementos(proyecto_id, tipo);

-- 5. Trigger: bump proyecto updated_at
CREATE TRIGGER trg_complementos_bump
  AFTER INSERT OR UPDATE OR DELETE ON complementos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();
