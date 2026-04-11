-- Error logging table for API error monitoring
-- Captures server-side errors with full user/project context
-- Viewable in /admin/errores

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Error info
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,           -- e.g. ERR_INVALID_CHAR, PGRST116

  -- Request context
  route TEXT NOT NULL,       -- e.g. /api/media/presign
  method TEXT NOT NULL DEFAULT 'POST',
  status_code INTEGER NOT NULL DEFAULT 500,

  -- User context (nullable — error may happen before auth)
  user_id UUID,
  user_email TEXT,
  user_role TEXT,

  -- Project context (nullable — not all routes are project-scoped)
  proyecto_id UUID,
  proyecto_nombre TEXT,

  -- Client context
  ip_address TEXT,
  user_agent TEXT,

  -- Extra data
  metadata JSONB DEFAULT '{}',

  -- Classification
  severity TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('warning', 'error', 'critical')),

  -- Tracking
  sentry_event_id TEXT,
  fingerprint TEXT,          -- for grouping similar errors
  occurrence_count INTEGER NOT NULL DEFAULT 1,

  -- Resolution
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  resolution_note TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_error_logs_created_at ON error_logs (created_at DESC);
CREATE INDEX idx_error_logs_severity ON error_logs (severity) WHERE NOT resolved;
CREATE INDEX idx_error_logs_route ON error_logs (route);
CREATE INDEX idx_error_logs_user_id ON error_logs (user_id);
CREATE INDEX idx_error_logs_fingerprint ON error_logs (fingerprint);
CREATE INDEX idx_error_logs_resolved ON error_logs (resolved) WHERE NOT resolved;

-- RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Platform admins can read all
CREATE POLICY "Platform admins read error_logs"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
    )
  );

-- Platform admins can update (resolve)
CREATE POLICY "Platform admins update error_logs"
  ON error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins WHERE user_id = auth.uid()
    )
  );

-- Service role inserts bypass RLS entirely, so no INSERT policy needed.
-- No INSERT policy = only service role can insert (which is the intent).

-- Stats RPC for admin dashboard
CREATE OR REPLACE FUNCTION error_log_stats()
RETURNS TABLE (
  total_unresolved BIGINT,
  critical BIGINT,
  errors BIGINT,
  warnings BIGINT
) AS $$
  SELECT
    COUNT(*) FILTER (WHERE NOT resolved) AS total_unresolved,
    COUNT(*) FILTER (WHERE NOT resolved AND severity = 'critical') AS critical,
    COUNT(*) FILTER (WHERE NOT resolved AND severity = 'error') AS errors,
    COUNT(*) FILTER (WHERE NOT resolved AND severity = 'warning') AS warnings
  FROM error_logs;
$$ LANGUAGE sql SECURITY DEFINER;

-- Auto-cleanup: keep last 5000 entries
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM error_logs
  WHERE created_at < (
    SELECT created_at FROM error_logs ORDER BY created_at DESC OFFSET 4999 LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
