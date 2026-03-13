-- Per-project collaborator access
-- If a collaborator has rows here, they only see those projects.
-- If they have ZERO rows, they see ALL admin projects (backward compat).

CREATE TABLE colaborador_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(colaborador_id, proyecto_id)
);

ALTER TABLE colaborador_proyectos ENABLE ROW LEVEL SECURITY;

-- Admin can manage their own collaborators' project access
CREATE POLICY "admin_manage_collab_projects" ON colaborador_proyectos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.id = colaborador_proyectos.colaborador_id
      AND c.admin_user_id = auth.uid()
    )
  );

-- Collaborator can read their own project assignments
CREATE POLICY "collab_read_own_assignments" ON colaborador_proyectos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.id = colaborador_proyectos.colaborador_id
      AND c.colaborador_user_id = auth.uid()
      AND c.estado = 'activo'
    )
  );
