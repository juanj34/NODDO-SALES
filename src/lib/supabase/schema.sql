-- NodeSites Database Schema

CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  slug TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  logo_url TEXT,
  constructora_nombre TEXT,
  color_primario TEXT DEFAULT '#C9A96E',
  color_secundario TEXT DEFAULT '#ffffff',
  color_fondo TEXT DEFAULT '#0a0a0a',
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'publicado', 'archivado')),
  disclaimer TEXT DEFAULT 'Todas las imagenes son representaciones artisticas y no tienen ninguna relacion con el producto final.',
  whatsapp_numero TEXT,
  ubicacion_direccion TEXT,
  ubicacion_lat FLOAT,
  ubicacion_lng FLOAT,
  tour_360_url TEXT,
  brochure_url TEXT,
  render_principal_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tipologias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  area_m2 FLOAT,
  habitaciones INT,
  banos INT,
  precio_desde DECIMAL,
  plano_url TEXT,
  renders TEXT[],
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE galeria_categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  orden INT DEFAULT 0
);

CREATE TABLE galeria_imagenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id UUID REFERENCES galeria_categorias(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  orden INT DEFAULT 0
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  orden INT DEFAULT 0
);

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT,
  pais TEXT,
  tipologia_interes TEXT,
  mensaje TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologias ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE galeria_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public read for published projects
CREATE POLICY "Public read published projects"
  ON proyectos FOR SELECT
  USING (estado = 'publicado');

-- Owner full access
CREATE POLICY "Owner full access projects"
  ON proyectos FOR ALL
  USING (auth.uid() = user_id);

-- Public read for project children
CREATE POLICY "Public read tipologias"
  ON tipologias FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Public read galeria_categorias"
  ON galeria_categorias FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

CREATE POLICY "Public read galeria_imagenes"
  ON galeria_imagenes FOR SELECT
  USING (EXISTS (SELECT 1 FROM galeria_categorias gc JOIN proyectos p ON gc.proyecto_id = p.id WHERE gc.id = categoria_id AND p.estado = 'publicado'));

CREATE POLICY "Public read videos"
  ON videos FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'));

-- Leads: anyone can insert, owner can read
CREATE POLICY "Anyone can create leads"
  ON leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner read leads"
  ON leads FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));
