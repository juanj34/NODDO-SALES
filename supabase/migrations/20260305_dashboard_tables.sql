-- Dashboard Enhancement: Add missing tables and columns

-- =====================================================
-- 1. Add missing columns to tipologias
-- =====================================================
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS hotspots JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS caracteristicas TEXT[] DEFAULT '{}';
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS parqueaderos INTEGER DEFAULT 0;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS area_balcon FLOAT;

-- =====================================================
-- 2. Add missing column to proyectos
-- =====================================================
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS fachada_url TEXT;

-- =====================================================
-- 3. Create fachadas table (multiple facades per project)
-- =====================================================
CREATE TABLE IF NOT EXISTS fachadas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  imagen_url TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. Create unidades table (inventory units)
-- =====================================================
CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  tipologia_id UUID REFERENCES tipologias(id) ON DELETE SET NULL,
  identificador TEXT NOT NULL,
  piso INT,
  area_m2 FLOAT,
  precio DECIMAL,
  estado TEXT DEFAULT 'disponible' CHECK (estado IN ('disponible', 'separado', 'reservada', 'vendida')),
  habitaciones INT,
  banos INT,
  orientacion TEXT,
  vista TEXT,
  notas TEXT,
  fachada_id UUID REFERENCES fachadas(id) ON DELETE SET NULL,
  fachada_x FLOAT,
  fachada_y FLOAT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. Create recursos table (downloadable resources)
-- =====================================================
CREATE TABLE IF NOT EXISTS recursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  tipo TEXT DEFAULT 'otro' CHECK (tipo IN ('brochure', 'ficha_tecnica', 'acabados', 'precios', 'otro')),
  url TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. puntos_interes already created in previous migration
-- =====================================================

-- =====================================================
-- 7. RLS Policies
-- =====================================================

-- Fachadas
ALTER TABLE fachadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fachadas"
  ON fachadas FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access fachadas"
  ON fachadas FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- Unidades
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read unidades"
  ON unidades FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access unidades"
  ON unidades FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- Recursos
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read recursos"
  ON recursos FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Owner full access recursos"
  ON recursos FOR ALL
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

-- Puntos de interes: RLS already configured in previous migration

-- =====================================================
-- 8. Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_fachadas_proyecto_id ON fachadas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_unidades_proyecto_id ON unidades(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_unidades_tipologia_id ON unidades(tipologia_id);
CREATE INDEX IF NOT EXISTS idx_unidades_fachada_id ON unidades(fachada_id);
CREATE INDEX IF NOT EXISTS idx_recursos_proyecto_id ON recursos(proyecto_id);
-- idx_puntos_interes_proyecto_id already created in previous migration
