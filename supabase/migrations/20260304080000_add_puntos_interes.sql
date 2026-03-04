-- Add puntos_interes table for map POIs
CREATE TABLE IF NOT EXISTS puntos_interes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL DEFAULT 'General',
  imagen_url TEXT,
  ciudad TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  distancia_km DOUBLE PRECISION,
  tiempo_minutos INTEGER,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE puntos_interes ENABLE ROW LEVEL SECURITY;

-- Public can read POIs for published projects
CREATE POLICY "Public read puntos_interes"
  ON puntos_interes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE id = puntos_interes.proyecto_id
    AND estado = 'publicado'
  ));

-- Project owner has full access
CREATE POLICY "Owner full access puntos_interes"
  ON puntos_interes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE id = puntos_interes.proyecto_id
    AND auth.uid() = user_id
  ));

-- Index for faster lookups
CREATE INDEX idx_puntos_interes_proyecto_id ON puntos_interes(proyecto_id);
