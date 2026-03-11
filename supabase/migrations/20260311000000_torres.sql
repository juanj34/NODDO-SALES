-- ============================================================
-- Migration: Add torres table for multi-torre support
-- ============================================================

-- 1. Create torres table
CREATE TABLE IF NOT EXISTS torres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  num_pisos INT,
  descripcion TEXT,
  amenidades TEXT,
  caracteristicas TEXT,
  imagen_portada TEXT,
  logo_url TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add torre_id FK to fachadas
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS torre_id UUID REFERENCES torres(id) ON DELETE SET NULL;

-- 3. Add torre_id FK to plano_puntos
ALTER TABLE plano_puntos ADD COLUMN IF NOT EXISTS torre_id UUID REFERENCES torres(id) ON DELETE SET NULL;

-- 4. RLS Policies
ALTER TABLE torres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read torres"
  ON torres FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access torres"
  ON torres FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_torres_proyecto_id ON torres(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_fachadas_torre_id ON fachadas(torre_id);
CREATE INDEX IF NOT EXISTS idx_plano_puntos_torre_id ON plano_puntos(torre_id);

-- 6. Trigger: bump proyecto updated_at
CREATE TRIGGER trg_torres_bump
  AFTER INSERT OR UPDATE OR DELETE ON torres
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();
