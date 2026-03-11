-- ============================================================
-- Migration: Collaborator System
-- Adds colaboradores table, RLS helper function, and updates
-- all existing policies to support collaborator access.
-- ============================================================

-- 1. Helper function: checks if current user is owner OR active collaborator
CREATE OR REPLACE FUNCTION is_project_authorized(project_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    auth.uid() = project_user_id
    OR EXISTS (
      SELECT 1 FROM colaboradores
      WHERE colaborador_user_id = auth.uid()
      AND admin_user_id = project_user_id
      AND estado = 'activo'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. Create colaboradores table
CREATE TABLE colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'activo', 'suspendido')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(admin_user_id, email)
);

CREATE INDEX idx_colaboradores_admin ON colaboradores(admin_user_id);
CREATE INDEX idx_colaboradores_user ON colaboradores(colaborador_user_id);
CREATE INDEX idx_colaboradores_email ON colaboradores(email);

ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage colaboradores"
  ON colaboradores FOR ALL
  USING (auth.uid() = admin_user_id);

CREATE POLICY "Colaborador read own"
  ON colaboradores FOR SELECT
  USING (auth.uid() = colaborador_user_id);


-- ============================================================
-- 3. Update RLS policies on all existing tables
-- ============================================================

-- ---- proyectos ----
DROP POLICY IF EXISTS "Owner full access projects" ON proyectos;

CREATE POLICY "Authorized select projects"
  ON proyectos FOR SELECT
  USING (
    estado = 'publicado'
    OR auth.uid() = user_id
    OR is_project_authorized(user_id)
  );

CREATE POLICY "Owner insert projects"
  ON proyectos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner update projects"
  ON proyectos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Owner delete projects"
  ON proyectos FOR DELETE
  USING (auth.uid() = user_id);

-- Drop old public read (now merged into Authorized select)
DROP POLICY IF EXISTS "Public read published projects" ON proyectos;


-- ---- tipologias ----
DROP POLICY IF EXISTS "Owner full access tipologias" ON tipologias;
DROP POLICY IF EXISTS "Public read tipologias" ON tipologias;

CREATE POLICY "Authorized select tipologias"
  ON tipologias FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write tipologias"
  ON tipologias FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update tipologias"
  ON tipologias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete tipologias"
  ON tipologias FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- galeria_categorias ----
DROP POLICY IF EXISTS "Owner full access galeria_categorias" ON galeria_categorias;
DROP POLICY IF EXISTS "Public read galeria_categorias" ON galeria_categorias;

CREATE POLICY "Authorized select galeria_categorias"
  ON galeria_categorias FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write galeria_categorias"
  ON galeria_categorias FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update galeria_categorias"
  ON galeria_categorias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete galeria_categorias"
  ON galeria_categorias FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- galeria_imagenes ----
DROP POLICY IF EXISTS "Owner full access galeria_imagenes" ON galeria_imagenes;
DROP POLICY IF EXISTS "Public read galeria_imagenes" ON galeria_imagenes;

CREATE POLICY "Authorized select galeria_imagenes"
  ON galeria_imagenes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write galeria_imagenes"
  ON galeria_imagenes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND auth.uid() = p.user_id
  ));

CREATE POLICY "Owner update galeria_imagenes"
  ON galeria_imagenes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND auth.uid() = p.user_id
  ));

CREATE POLICY "Owner delete galeria_imagenes"
  ON galeria_imagenes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND auth.uid() = p.user_id
  ));


-- ---- videos ----
DROP POLICY IF EXISTS "Owner full access videos" ON videos;
DROP POLICY IF EXISTS "Public read videos" ON videos;

CREATE POLICY "Authorized select videos"
  ON videos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write videos"
  ON videos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update videos"
  ON videos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete videos"
  ON videos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- leads ----
DROP POLICY IF EXISTS "Owner read leads" ON leads;

CREATE POLICY "Authorized read leads"
  ON leads FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND is_project_authorized(p.user_id)
  ));


-- ---- puntos_interes ----
DROP POLICY IF EXISTS "Owner full access puntos_interes" ON puntos_interes;
DROP POLICY IF EXISTS "Public read puntos_interes" ON puntos_interes;

CREATE POLICY "Authorized select puntos_interes"
  ON puntos_interes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write puntos_interes"
  ON puntos_interes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update puntos_interes"
  ON puntos_interes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete puntos_interes"
  ON puntos_interes FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- fachadas ----
DROP POLICY IF EXISTS "Owner full access fachadas" ON fachadas;
DROP POLICY IF EXISTS "Public read fachadas" ON fachadas;

CREATE POLICY "Authorized select fachadas"
  ON fachadas FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write fachadas"
  ON fachadas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update fachadas"
  ON fachadas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete fachadas"
  ON fachadas FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- unidades (special: collaborators can UPDATE) ----
DROP POLICY IF EXISTS "Owner full access unidades" ON unidades;
DROP POLICY IF EXISTS "Public read unidades" ON unidades;

CREATE POLICY "Authorized select unidades"
  ON unidades FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

-- Both owner and collaborator can UPDATE (API restricts collaborator to estado only)
CREATE POLICY "Authorized update unidades"
  ON unidades FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND is_project_authorized(p.user_id)
  ));

CREATE POLICY "Owner insert unidades"
  ON unidades FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete unidades"
  ON unidades FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- recursos ----
DROP POLICY IF EXISTS "Owner full access recursos" ON recursos;
DROP POLICY IF EXISTS "Public read recursos" ON recursos;

CREATE POLICY "Authorized select recursos"
  ON recursos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write recursos"
  ON recursos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update recursos"
  ON recursos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete recursos"
  ON recursos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- torres ----
DROP POLICY IF EXISTS "Owner full access torres" ON torres;
DROP POLICY IF EXISTS "Public read torres" ON torres;

CREATE POLICY "Authorized select torres"
  ON torres FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write torres"
  ON torres FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update torres"
  ON torres FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete torres"
  ON torres FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- planos_interactivos ----
DROP POLICY IF EXISTS "Owner full access planos_interactivos" ON planos_interactivos;
DROP POLICY IF EXISTS "Public read planos_interactivos" ON planos_interactivos;

CREATE POLICY "Authorized select planos_interactivos"
  ON planos_interactivos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write planos_interactivos"
  ON planos_interactivos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner update planos_interactivos"
  ON planos_interactivos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner delete planos_interactivos"
  ON planos_interactivos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));


-- ---- plano_puntos ----
DROP POLICY IF EXISTS "Owner full access plano_puntos" ON plano_puntos;
DROP POLICY IF EXISTS "Public read plano_puntos" ON plano_puntos;

CREATE POLICY "Authorized select plano_puntos"
  ON plano_puntos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner write plano_puntos"
  ON plano_puntos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND auth.uid() = p.user_id
  ));

CREATE POLICY "Owner update plano_puntos"
  ON plano_puntos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND auth.uid() = p.user_id
  ));

CREATE POLICY "Owner delete plano_puntos"
  ON plano_puntos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND auth.uid() = p.user_id
  ));


-- ---- proyecto_versiones ----
DROP POLICY IF EXISTS "Owner read versiones" ON proyecto_versiones;
DROP POLICY IF EXISTS "Owner insert versiones" ON proyecto_versiones;
DROP POLICY IF EXISTS "Public read published versions" ON proyecto_versiones;

CREATE POLICY "Authorized select versiones"
  ON proyecto_versiones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Owner insert versiones"
  ON proyecto_versiones FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));
