-- Cotizador module: configurable quotation engine per project
-- Adds cotizador config to proyectos + cotizaciones table for generated quotes

-- 1. Add cotizador columns to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS cotizador_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS cotizador_config JSONB DEFAULT null;

-- 2. Cotizaciones table (stores generated quotations)
CREATE TABLE IF NOT EXISTS cotizaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  unidad_id UUID REFERENCES unidades(id) ON DELETE SET NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  unidad_snapshot JSONB NOT NULL,
  config_snapshot JSONB NOT NULL,
  resultado JSONB NOT NULL,
  pdf_url TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS for cotizaciones
ALTER TABLE cotizaciones ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public quotation requests from microsite)
CREATE POLICY "Public insert cotizaciones"
  ON cotizaciones FOR INSERT
  WITH CHECK (true);

-- Project owner can read their cotizaciones
CREATE POLICY "Owner select cotizaciones"
  ON cotizaciones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND p.user_id = auth.uid()
  ));

-- Collaborators can also read cotizaciones
CREATE POLICY "Collaborator select cotizaciones"
  ON cotizaciones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    JOIN colaboradores c ON c.admin_user_id = p.user_id
    WHERE p.id = proyecto_id
    AND c.colaborador_user_id = auth.uid()
    AND c.estado = 'activo'
  ));

-- 4. Trigger to bump proyecto updated_at on cotizacion insert
CREATE OR REPLACE TRIGGER cotizaciones_bump_proyecto
  AFTER INSERT ON cotizaciones
  FOR EACH ROW
  EXECUTE FUNCTION bump_proyecto_updated_at();

-- 5. Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_cotizaciones_proyecto_id ON cotizaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_unidad_id ON cotizaciones(unidad_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_email ON cotizaciones(email);
