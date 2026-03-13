-- ============================================================
-- Migration: Analytics Improvements
-- 1. Add composite index (proyecto_id, visitor_id) for COUNT(DISTINCT)
-- 2. Add 'tour_360_view' to event_type CHECK constraint
-- ============================================================

-- Composite index for faster unique visitor counts
CREATE INDEX IF NOT EXISTS idx_analytics_proyecto_visitor
  ON analytics_events(proyecto_id, visitor_id);

-- Drop existing CHECK constraint and re-add with tour_360_view
ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;
ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_type_check
  CHECK (event_type IN (
    'pageview',
    'whatsapp_click',
    'brochure_download',
    'video_play',
    'cta_click',
    'recurso_download',
    'lead_submit',
    'tour_360_view'
  ));
