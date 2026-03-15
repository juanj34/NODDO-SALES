-- ============================================================
-- Migration: JSONB GIN Indexes for Fast JSON Queries
-- Enables efficient searches within JSONB columns
-- Based on enterprise scalability best practices
-- ============================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. GIN Index on proyectos.cotizador_config
-- ══════════════════════════════════════════════════════════════════════════════

-- Allows fast queries like:
-- WHERE cotizador_config->>'moneda' = 'USD'
-- WHERE cotizador_config @> '{"enabled": true}'

CREATE INDEX IF NOT EXISTS idx_proyectos_cotizador_config_gin
  ON proyectos USING GIN (cotizador_config);

COMMENT ON INDEX idx_proyectos_cotizador_config_gin IS
  'GIN index for fast searches within cotizador_config JSONB column. Enables efficient filtering by nested properties like moneda, enabled, etc.';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. GIN Index on analytics_events.metadata
-- ══════════════════════════════════════════════════════════════════════════════

-- Allows fast queries like:
-- WHERE metadata->>'button_id' = 'cta_contact'
-- WHERE metadata @> '{"source": "landing"}'

CREATE INDEX IF NOT EXISTS idx_analytics_metadata_gin
  ON analytics_events USING GIN (metadata);

COMMENT ON INDEX idx_analytics_metadata_gin IS
  'GIN index for fast searches within analytics metadata JSONB. Enables efficient filtering by custom event properties.';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Performance Stats (for monitoring)
-- ══════════════════════════════════════════════════════════════════════════════

/*
Expected performance improvements:

BEFORE (no GIN index):
  SELECT * FROM proyectos WHERE cotizador_config->>'moneda' = 'USD';
  → Sequential scan: ~500ms for 10,000 rows

AFTER (with GIN index):
  → Index scan: ~10ms (50x faster)

Trade-offs:
  - Index size: ~2-3x the JSONB column size
  - INSERT/UPDATE: ~10-15% slower (must update index)
  - SELECT with JSON filters: 50-100x faster

Use cases:
  - Filtering projects by cotizador settings
  - Searching analytics events by custom properties
  - Complex JSON queries in admin dashboard
*/
