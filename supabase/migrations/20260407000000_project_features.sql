-- Per-project feature flags (add-ons model)
CREATE TABLE IF NOT EXISTS project_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id uuid NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  feature text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proyecto_id, feature)
);

-- Add max_collaborators to user_plans
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS max_collaborators int NOT NULL DEFAULT 5;

-- RLS
ALTER TABLE project_features ENABLE ROW LEVEL SECURITY;

-- Owners can read their own project features
CREATE POLICY "project_features_owner_read" ON project_features
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM proyectos p WHERE p.id = proyecto_id AND p.user_id = auth.uid())
  );

-- Collaborators can read features for their admin's projects
CREATE POLICY "project_features_collab_read" ON project_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM proyectos p
      JOIN colaboradores c ON c.admin_user_id = p.user_id
      WHERE p.id = proyecto_id
        AND c.colaborador_user_id = auth.uid()
        AND c.estado = 'activo'
    )
  );

-- Platform admins can manage all features
CREATE POLICY "project_features_admin_all" ON project_features
  FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Seed juan@noddo.io as platform admin
INSERT INTO platform_admins (user_id, email, nombre)
SELECT id, email, 'Juan'
FROM auth.users
WHERE email = 'juan@noddo.io'
ON CONFLICT (user_id) DO NOTHING;
