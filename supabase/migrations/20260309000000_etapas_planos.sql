-- Etapas (towers/phases/sectors) + Planos Interactivos (Implantaciones & Urbanismo)

-- =====================================================
-- 1. Add etapa_label to proyectos (display label for etapas)
-- =====================================================
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS etapa_label TEXT DEFAULT 'Etapas';

-- =====================================================
-- 2. Create etapas table (generic grouping: torres, etapas, sectores, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  num_pisos INT,
  descripcion TEXT,
  amenidades TEXT,
  imagen_url TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. Add etapa_id to unidades and fachadas
-- =====================================================
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS etapa_id UUID REFERENCES etapas(id) ON DELETE SET NULL;
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS etapa_id UUID REFERENCES etapas(id) ON DELETE SET NULL;

-- =====================================================
-- 4. Create planos_interactivos table (implantaciones + urbanismo)
-- =====================================================
CREATE TABLE IF NOT EXISTS planos_interactivos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('implantacion', 'urbanismo')),
  visible BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. Create plano_puntos table (hotspot points on planos)
-- =====================================================
CREATE TABLE IF NOT EXISTS plano_puntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID REFERENCES planos_interactivos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  etapa_id UUID REFERENCES etapas(id) ON DELETE SET NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. RLS Policies
-- =====================================================

-- Etapas
ALTER TABLE etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read etapas"
  ON etapas FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access etapas"
  ON etapas FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- Planos Interactivos
ALTER TABLE planos_interactivos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read planos_interactivos"
  ON planos_interactivos FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access planos_interactivos"
  ON planos_interactivos FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- Plano Puntos
ALTER TABLE plano_puntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read plano_puntos"
  ON plano_puntos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND p.estado = 'publicado'
  ));

CREATE POLICY "Owner full access plano_puntos"
  ON plano_puntos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND auth.uid() = p.user_id
  ));

-- =====================================================
-- 7. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_etapas_proyecto_id ON etapas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_unidades_etapa_id ON unidades(etapa_id);
CREATE INDEX IF NOT EXISTS idx_fachadas_etapa_id ON fachadas(etapa_id);
CREATE INDEX IF NOT EXISTS idx_planos_interactivos_proyecto_id ON planos_interactivos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_plano_puntos_plano_id ON plano_puntos(plano_id);
CREATE INDEX IF NOT EXISTS idx_plano_puntos_etapa_id ON plano_puntos(etapa_id);

-- =====================================================
-- 8. Triggers for bump_proyecto_updated_at
-- =====================================================

-- Etapas: has proyecto_id directly
CREATE TRIGGER trg_etapas_bump
  AFTER INSERT OR UPDATE OR DELETE ON etapas
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

-- Planos Interactivos: has proyecto_id directly
CREATE TRIGGER trg_planos_interactivos_bump
  AFTER INSERT OR UPDATE OR DELETE ON planos_interactivos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

-- Plano Puntos: indirect via plano_id → planos_interactivos.proyecto_id
CREATE OR REPLACE FUNCTION bump_proyecto_from_plano_punto()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proyectos SET updated_at = now()
  WHERE id = (
    SELECT proyecto_id FROM planos_interactivos
    WHERE id = COALESCE(NEW.plano_id, OLD.plano_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_plano_puntos_bump
  AFTER INSERT OR UPDATE OR DELETE ON plano_puntos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_from_plano_punto();
