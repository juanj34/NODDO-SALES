-- ============================================================
-- Migration: Roles & Permissions System
-- Evolves 2-role (admin/colaborador) to 3-role (admin/director/asesor)
-- Adds lead assignment for asesor filtering
-- Updates RLS policies to allow directors to write content
-- ============================================================

-- 1. Add rol column to colaboradores (existing rows default to 'asesor')
ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS rol TEXT NOT NULL DEFAULT 'asesor'
  CHECK (rol IN ('director', 'asesor'));

CREATE INDEX IF NOT EXISTS idx_colaboradores_rol ON colaboradores(rol);

-- 2. Add lead assignment column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS asignado_a UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_leads_asignado_a ON leads(asignado_a) WHERE asignado_a IS NOT NULL;

-- 3. Helper function: checks if current user is owner OR active director
CREATE OR REPLACE FUNCTION is_content_writer(project_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() = project_user_id THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaborador_user_id = auth.uid()
      AND admin_user_id = project_user_id
      AND estado = 'activo'
      AND rol = 'director'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- 4. Update RLS write policies on content tables
--    Replace "Owner write/update/delete" with "Content writer" versions
--    SELECT policies stay unchanged (all collaborators can read)
-- ============================================================

-- ---- tipologias ----
DROP POLICY IF EXISTS "Owner write tipologias" ON tipologias;
DROP POLICY IF EXISTS "Owner update tipologias" ON tipologias;
DROP POLICY IF EXISTS "Owner delete tipologias" ON tipologias;

CREATE POLICY "Content writer insert tipologias"
  ON tipologias FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update tipologias"
  ON tipologias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete tipologias"
  ON tipologias FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- galeria_categorias ----
DROP POLICY IF EXISTS "Owner write galeria_categorias" ON galeria_categorias;
DROP POLICY IF EXISTS "Owner update galeria_categorias" ON galeria_categorias;
DROP POLICY IF EXISTS "Owner delete galeria_categorias" ON galeria_categorias;

CREATE POLICY "Content writer insert galeria_categorias"
  ON galeria_categorias FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update galeria_categorias"
  ON galeria_categorias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete galeria_categorias"
  ON galeria_categorias FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- galeria_imagenes ----
DROP POLICY IF EXISTS "Owner write galeria_imagenes" ON galeria_imagenes;
DROP POLICY IF EXISTS "Owner update galeria_imagenes" ON galeria_imagenes;
DROP POLICY IF EXISTS "Owner delete galeria_imagenes" ON galeria_imagenes;

CREATE POLICY "Content writer insert galeria_imagenes"
  ON galeria_imagenes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND is_content_writer(p.user_id)
  ));

CREATE POLICY "Content writer update galeria_imagenes"
  ON galeria_imagenes FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND is_content_writer(p.user_id)
  ));

CREATE POLICY "Content writer delete galeria_imagenes"
  ON galeria_imagenes FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM galeria_categorias gc
    JOIN proyectos p ON p.id = gc.proyecto_id
    WHERE gc.id = categoria_id AND is_content_writer(p.user_id)
  ));


-- ---- videos ----
DROP POLICY IF EXISTS "Owner write videos" ON videos;
DROP POLICY IF EXISTS "Owner update videos" ON videos;
DROP POLICY IF EXISTS "Owner delete videos" ON videos;

CREATE POLICY "Content writer insert videos"
  ON videos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update videos"
  ON videos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete videos"
  ON videos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- fachadas ----
DROP POLICY IF EXISTS "Owner write fachadas" ON fachadas;
DROP POLICY IF EXISTS "Owner update fachadas" ON fachadas;
DROP POLICY IF EXISTS "Owner delete fachadas" ON fachadas;

CREATE POLICY "Content writer insert fachadas"
  ON fachadas FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update fachadas"
  ON fachadas FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete fachadas"
  ON fachadas FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- puntos_interes ----
DROP POLICY IF EXISTS "Owner write puntos_interes" ON puntos_interes;
DROP POLICY IF EXISTS "Owner update puntos_interes" ON puntos_interes;
DROP POLICY IF EXISTS "Owner delete puntos_interes" ON puntos_interes;

CREATE POLICY "Content writer insert puntos_interes"
  ON puntos_interes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update puntos_interes"
  ON puntos_interes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete puntos_interes"
  ON puntos_interes FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- planos_interactivos ----
DROP POLICY IF EXISTS "Owner write planos_interactivos" ON planos_interactivos;
DROP POLICY IF EXISTS "Owner update planos_interactivos" ON planos_interactivos;
DROP POLICY IF EXISTS "Owner delete planos_interactivos" ON planos_interactivos;

CREATE POLICY "Content writer insert planos_interactivos"
  ON planos_interactivos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update planos_interactivos"
  ON planos_interactivos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete planos_interactivos"
  ON planos_interactivos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- plano_puntos ----
DROP POLICY IF EXISTS "Owner write plano_puntos" ON plano_puntos;
DROP POLICY IF EXISTS "Owner update plano_puntos" ON plano_puntos;
DROP POLICY IF EXISTS "Owner delete plano_puntos" ON plano_puntos;

CREATE POLICY "Content writer insert plano_puntos"
  ON plano_puntos FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND is_content_writer(p.user_id)
  ));

CREATE POLICY "Content writer update plano_puntos"
  ON plano_puntos FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND is_content_writer(p.user_id)
  ));

CREATE POLICY "Content writer delete plano_puntos"
  ON plano_puntos FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM planos_interactivos pi
    JOIN proyectos p ON p.id = pi.proyecto_id
    WHERE pi.id = plano_id AND is_content_writer(p.user_id)
  ));


-- ---- recursos ----
DROP POLICY IF EXISTS "Owner write recursos" ON recursos;
DROP POLICY IF EXISTS "Owner update recursos" ON recursos;
DROP POLICY IF EXISTS "Owner delete recursos" ON recursos;

CREATE POLICY "Content writer insert recursos"
  ON recursos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update recursos"
  ON recursos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete recursos"
  ON recursos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- torres ----
DROP POLICY IF EXISTS "Owner write torres" ON torres;
DROP POLICY IF EXISTS "Owner update torres" ON torres;
DROP POLICY IF EXISTS "Owner delete torres" ON torres;

CREATE POLICY "Content writer insert torres"
  ON torres FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update torres"
  ON torres FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete torres"
  ON torres FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- vistas_piso ----
DROP POLICY IF EXISTS "Owner write vistas_piso" ON vistas_piso;
DROP POLICY IF EXISTS "Owner update vistas_piso" ON vistas_piso;
DROP POLICY IF EXISTS "Owner delete vistas_piso" ON vistas_piso;

CREATE POLICY "Content writer insert vistas_piso"
  ON vistas_piso FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update vistas_piso"
  ON vistas_piso FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete vistas_piso"
  ON vistas_piso FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- complementos ----
DROP POLICY IF EXISTS "Owner write complementos" ON complementos;
DROP POLICY IF EXISTS "Owner update complementos" ON complementos;
DROP POLICY IF EXISTS "Owner delete complementos" ON complementos;

CREATE POLICY "Content writer insert complementos"
  ON complementos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update complementos"
  ON complementos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete complementos"
  ON complementos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ---- unidades: also open INSERT/DELETE to directors ----
DROP POLICY IF EXISTS "Owner insert unidades" ON unidades;
DROP POLICY IF EXISTS "Owner delete unidades" ON unidades;

CREATE POLICY "Content writer insert unidades"
  ON unidades FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete unidades"
  ON unidades FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));


-- ============================================================
-- 5. Update leads RLS to support asesor assignment filtering
--    API layer enforces asesor sees only assigned leads.
--    RLS stays broad (all authorized users) for simplicity.
--    The asignado_a column enables API-level filtering.
-- ============================================================

-- No RLS change needed — current "Authorized read leads" policy
-- uses is_project_authorized() which allows all active collaborators.
-- The API layer (GET /api/leads) will add WHERE asignado_a = user.id for asesores.
