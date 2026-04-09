-- Allow directors (active collaborators) to publish projects.
-- API-level permission check restricts this to director+ roles;
-- RLS allows any authorized collaborator (same pattern as unidades).

-- 1. proyecto_versiones: allow collaborators to INSERT (for publishing snapshots)
DROP POLICY IF EXISTS "Admin insert versiones" ON proyecto_versiones;

CREATE POLICY "Authorized insert versiones"
  ON proyecto_versiones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = proyecto_id
      AND is_project_authorized(p.user_id)
    )
  );

-- 2. proyectos: allow collaborators to UPDATE (for setting estado = publicado/borrador)
-- Replace owner-only policy with authorized (owner + active collaborator)
DROP POLICY IF EXISTS "Owner update projects" ON proyectos;

CREATE POLICY "Authorized update projects"
  ON proyectos FOR UPDATE
  USING (is_project_authorized(user_id));
