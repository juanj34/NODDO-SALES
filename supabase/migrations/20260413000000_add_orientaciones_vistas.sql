-- =====================================================
-- Create orientaciones table
-- =====================================================
CREATE TABLE IF NOT EXISTS orientaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Create vistas table
-- =====================================================
CREATE TABLE IF NOT EXISTS vistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Add ID columns to unidades (keep TEXT columns for backwards compatibility)
-- =====================================================
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS orientacion_id UUID REFERENCES orientaciones(id) ON DELETE SET NULL;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS vista_id UUID REFERENCES vistas(id) ON DELETE SET NULL;

-- =====================================================
-- Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_orientaciones_proyecto_id ON orientaciones(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_vistas_proyecto_id ON vistas(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_unidades_orientacion_id ON unidades(orientacion_id);
CREATE INDEX IF NOT EXISTS idx_unidades_vista_id ON unidades(vista_id);
