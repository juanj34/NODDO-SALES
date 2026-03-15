-- Fix RLS policies for proyecto_versiones to allow collaborators to read versions

-- Drop existing policy
DROP POLICY IF EXISTS "Owner read versiones" ON proyecto_versiones;

-- Recreate with collaborator support
CREATE POLICY "Owner and collaborator read versiones"
  ON proyecto_versiones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proyectos
      WHERE id = proyecto_id
      AND is_project_authorized(user_id)
    )
  );

-- Ensure only admins can insert (collaborators cannot publish)
DROP POLICY IF EXISTS "Owner insert versiones" ON proyecto_versiones;

CREATE POLICY "Admin insert versiones"
  ON proyecto_versiones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = proyecto_id
      AND p.user_id = auth.uid()
    )
  );
