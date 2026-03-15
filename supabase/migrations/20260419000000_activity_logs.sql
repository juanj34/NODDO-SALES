-- Activity Logs — user-friendly activity feed for dashboard browsing and daily digest
-- Separate from technical audit_logs; focused on business events with human-readable descriptions

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_role TEXT NOT NULL CHECK (user_role IN ('admin', 'colaborador')),

  -- Project scope (denormalized for fast queries)
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  proyecto_nombre TEXT,

  -- Action classification
  action_type TEXT NOT NULL,
  action_category TEXT NOT NULL CHECK (action_category IN (
    'project', 'unit', 'tipologia', 'gallery', 'video',
    'lead', 'cotizacion', 'colaborador', 'content', 'other'
  )),

  -- Human-readable descriptions (pre-generated)
  description TEXT NOT NULL,
  description_en TEXT,

  -- Flexible metadata (before/after values, counts, identifiers)
  metadata JSONB DEFAULT '{}',

  -- Entity reference for deep linking
  entity_type TEXT,
  entity_id UUID,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_proyecto_cat_date ON activity_logs(proyecto_id, action_category, created_at DESC);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);

-- RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins see activities for projects they own
CREATE POLICY "Admins read own project activities"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = activity_logs.proyecto_id
        AND p.user_id = auth.uid()
    )
    OR (activity_logs.user_id = auth.uid() AND activity_logs.proyecto_id IS NULL)
  );

-- Collaborators see activities for their assigned projects
CREATE POLICY "Collaborators read assigned project activities"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM colaboradores c
      WHERE c.colaborador_user_id = auth.uid()
        AND c.estado = 'activo'
        AND (
          -- If no specific project assignments, they see all admin projects
          NOT EXISTS (SELECT 1 FROM colaborador_proyectos cp WHERE cp.colaborador_id = c.id)
          OR EXISTS (
            SELECT 1 FROM colaborador_proyectos cp
            WHERE cp.colaborador_id = c.id
              AND cp.proyecto_id = activity_logs.proyecto_id
          )
        )
    )
  );

-- Platform admins see everything
CREATE POLICY "Platform admins read all activities"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Service role can insert (used by activity-logger.ts via admin client)
CREATE POLICY "Service role inserts activities"
  ON activity_logs FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE activity_logs IS 'User-friendly activity log for dashboard browsing and daily digest reporting';
