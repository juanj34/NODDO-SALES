-- ============================================================
-- Migration: Optimize RLS Policies with Helper Functions
-- Adds optimized helper functions and indexes for RLS policies
-- Based on Supabase/Postgres best practices audit
-- ============================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Helper function: Check if user owns a galeria_imagen
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION user_owns_galeria_imagen(p_imagen_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM galeria_imagenes gi
    INNER JOIN galeria_categorias gc ON gi.categoria_id = gc.id
    INNER JOIN proyectos p ON gc.proyecto_id = p.id
    WHERE gi.id = p_imagen_id
      AND p.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public_can_read_galeria_imagen(p_imagen_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM galeria_imagenes gi
    INNER JOIN galeria_categorias gc ON gi.categoria_id = gc.id
    INNER JOIN proyectos p ON gc.proyecto_id = p.id
    WHERE gi.id = p_imagen_id
      AND p.estado = 'publicado'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_owns_galeria_imagen IS 'Optimized RLS helper: checks if current user owns a gallery image via proyecto ownership';
COMMENT ON FUNCTION public_can_read_galeria_imagen IS 'Optimized RLS helper: checks if gallery image belongs to published project';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Add indexes to support RLS helper functions efficiently
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for galeria_imagenes -> categoria_id lookups
CREATE INDEX IF NOT EXISTS idx_galeria_imagenes_categoria_lookup
  ON galeria_imagenes(id, categoria_id);

-- Index for colaboradores active status checks
CREATE INDEX IF NOT EXISTS idx_colaboradores_active_lookup
  ON colaboradores(admin_user_id, colaborador_user_id)
  WHERE estado = 'activo';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Grant execute permissions on new helper functions
-- ══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION user_owns_galeria_imagen TO authenticated;
GRANT EXECUTE ON FUNCTION public_can_read_galeria_imagen TO authenticated, anon;

-- ══════════════════════════════════════════════════════════════════════════════
-- Note: Other RLS policies already optimized in earlier migrations
-- ══════════════════════════════════════════════════════════════════════════════

-- is_project_authorized(project_user_id UUID) created in 20260320000000_colaboradores.sql
-- "Authorized read leads" policy created in 20260320000000_colaboradores.sql
-- Other child table policies (tipologias, videos, etc.) also already use is_project_authorized
-- This migration adds additional helper functions and indexes for further optimization
