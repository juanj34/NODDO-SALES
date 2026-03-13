-- ============================================
-- Admin Audit Log + Platform Analytics RPCs
-- ============================================

-- 1. Admin Audit Log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  admin_email text NOT NULL,
  action text NOT NULL CHECK (action IN (
    'user_banned', 'user_unbanned', 'user_deleted',
    'plan_changed', 'project_archived', 'project_deleted',
    'admin_added', 'admin_removed'
  )),
  target_type text NOT NULL CHECK (target_type IN ('user', 'project', 'admin')),
  target_id text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_log(action);
CREATE INDEX idx_audit_admin ON admin_audit_log(admin_id);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Platform admins can read audit logs
CREATE POLICY "audit_log_platform_admin_read" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Insert via service role (admin client bypasses RLS)
CREATE POLICY "audit_log_service_insert" ON admin_audit_log
  FOR INSERT WITH CHECK (true);

-- 2. Platform-wide analytics RPCs (SECURITY DEFINER = bypass RLS)

-- Views over time (aggregated across ALL projects)
CREATE OR REPLACE FUNCTION platform_views_over_time(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE(bucket TIMESTAMPTZ, views BIGINT, visitors BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_granularity, ae.created_at) AS bucket,
    COUNT(*)::BIGINT AS views,
    COUNT(DISTINCT ae.visitor_id)::BIGINT AS visitors
  FROM analytics_events ae
  WHERE ae.event_type = 'pageview'
    AND ae.created_at >= p_from
    AND ae.created_at <= p_to
  GROUP BY date_trunc(p_granularity, ae.created_at)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Platform-wide summary counts by event type
CREATE OR REPLACE FUNCTION platform_analytics_summary(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_views', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'pageview' AND created_at >= p_from AND created_at <= p_to),
    'unique_visitors', (SELECT COUNT(DISTINCT visitor_id) FROM analytics_events WHERE event_type = 'pageview' AND created_at >= p_from AND created_at <= p_to),
    'total_sessions', (SELECT COUNT(DISTINCT session_id) FROM analytics_events WHERE event_type = 'pageview' AND created_at >= p_from AND created_at <= p_to),
    'whatsapp_clicks', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'whatsapp_click' AND created_at >= p_from AND created_at <= p_to),
    'brochure_downloads', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'brochure_download' AND created_at >= p_from AND created_at <= p_to),
    'video_plays', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'video_play' AND created_at >= p_from AND created_at <= p_to),
    'recurso_downloads', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'recurso_download' AND created_at >= p_from AND created_at <= p_to),
    'cta_clicks', (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'cta_click' AND created_at >= p_from AND created_at <= p_to)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Users signups over time
CREATE OR REPLACE FUNCTION platform_users_over_time(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE(bucket TIMESTAMPTZ, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_granularity, u.created_at) AS bucket,
    COUNT(*)::BIGINT AS count
  FROM auth.users u
  WHERE u.created_at >= p_from
    AND u.created_at <= p_to
  GROUP BY date_trunc(p_granularity, u.created_at)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Projects created over time
CREATE OR REPLACE FUNCTION platform_projects_over_time(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE(bucket TIMESTAMPTZ, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_granularity, p.created_at) AS bucket,
    COUNT(*)::BIGINT AS count
  FROM proyectos p
  WHERE p.created_at >= p_from
    AND p.created_at <= p_to
  GROUP BY date_trunc(p_granularity, p.created_at)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Leads over time (platform-wide)
CREATE OR REPLACE FUNCTION platform_leads_over_time(
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ,
  p_granularity TEXT DEFAULT 'day'
)
RETURNS TABLE(bucket TIMESTAMPTZ, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_granularity, l.created_at) AS bucket,
    COUNT(*)::BIGINT AS count
  FROM leads l
  WHERE l.created_at >= p_from
    AND l.created_at <= p_to
  GROUP BY date_trunc(p_granularity, l.created_at)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Performance index for analytics_events platform-wide queries
CREATE INDEX IF NOT EXISTS idx_analytics_event_type_created
  ON analytics_events(event_type, created_at);
