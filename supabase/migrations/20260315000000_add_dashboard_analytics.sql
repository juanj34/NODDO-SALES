-- Dashboard analytics table for tracking admin/collaborator actions
CREATE TABLE IF NOT EXISTS dashboard_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT CHECK (user_role IN ('admin', 'colaborador')),
  page_path TEXT,
  session_id TEXT NOT NULL,
  visitor_id TEXT,
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  screen_width INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dashboard_analytics_user_id ON dashboard_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_analytics_event_type ON dashboard_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_analytics_created_at ON dashboard_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_analytics_session_id ON dashboard_analytics(session_id);

-- RLS policies (allow authenticated users to insert their own analytics)
ALTER TABLE dashboard_analytics ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert analytics
CREATE POLICY "Users can insert their own analytics"
  ON dashboard_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR user_id IS NULL
  );

-- Allow platform admins to read all analytics
CREATE POLICY "Platform admins can read all analytics"
  ON dashboard_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE platform_admins.user_id = auth.uid()
    )
  );

-- Comment for documentation
COMMENT ON TABLE dashboard_analytics IS 'Tracks admin and collaborator actions within the dashboard for analytics and user behavior analysis';
