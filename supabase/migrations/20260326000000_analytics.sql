-- ============================================================
-- Migration: Analytics Events
-- Single unified events table for page views, clicks, and
-- interactions on public microsites.
-- ============================================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pageview',
    'whatsapp_click',
    'brochure_download',
    'video_play',
    'cta_click',
    'recurso_download',
    'lead_submit'
  )),

  -- Page/content context
  page_path TEXT,

  -- Session & visitor grouping
  session_id TEXT NOT NULL,
  visitor_id TEXT,

  -- Device & browser
  device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  user_agent TEXT,
  screen_width INT,

  -- Traffic source
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Geography (resolved server-side from request headers)
  country TEXT,
  city TEXT,

  -- Extra event metadata (flexible JSON)
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes for dashboard queries ──
CREATE INDEX idx_analytics_proyecto ON analytics_events(proyecto_id);
CREATE INDEX idx_analytics_proyecto_type ON analytics_events(proyecto_id, event_type);
CREATE INDEX idx_analytics_proyecto_created ON analytics_events(proyecto_id, created_at DESC);
CREATE INDEX idx_analytics_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_visitor ON analytics_events(visitor_id);

-- ── RLS ──
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Public INSERT: anonymous visitors can write events
CREATE POLICY "Public insert analytics_events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Owner + collaborator can read their project's analytics
CREATE POLICY "Authorized select analytics_events"
  ON analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND is_project_authorized(p.user_id)
  ));

-- Only owner can delete (for data cleanup)
CREATE POLICY "Owner delete analytics_events"
  ON analytics_events FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND auth.uid() = p.user_id
  ));

-- ── RPC: Time-series aggregation ──
CREATE OR REPLACE FUNCTION analytics_views_over_time(
  p_proyecto_id UUID,
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
  WHERE ae.proyecto_id = p_proyecto_id
    AND ae.event_type = 'pageview'
    AND ae.created_at >= p_from
    AND ae.created_at <= p_to
  GROUP BY date_trunc(p_granularity, ae.created_at)
  ORDER BY bucket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── RPC: Summary counts ──
CREATE OR REPLACE FUNCTION analytics_summary(
  p_proyecto_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_views', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'pageview'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'unique_visitors', (
      SELECT COUNT(DISTINCT visitor_id) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'pageview'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'total_sessions', (
      SELECT COUNT(DISTINCT session_id) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'pageview'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'whatsapp_clicks', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'whatsapp_click'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'brochure_downloads', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'brochure_download'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'video_plays', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'video_play'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'recurso_downloads', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'recurso_download'
        AND created_at >= p_from AND created_at <= p_to
    ),
    'cta_clicks', (
      SELECT COUNT(*) FROM analytics_events
      WHERE proyecto_id = p_proyecto_id AND event_type = 'cta_click'
        AND created_at >= p_from AND created_at <= p_to
    )
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
