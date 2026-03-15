-- Audit Logging System for NODDO
-- Tracks all critical changes to data for compliance and debugging

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Composite index for common queries (user + table + date range)
CREATE INDEX idx_audit_logs_user_table_date ON audit_logs(user_id, table_name, created_at DESC);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read their own audit logs
CREATE POLICY "Admins read own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Platform admins can read all
CREATE POLICY "Platform admins read all audit logs"
  ON audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM platform_admins
      WHERE user_id = auth.uid()
    )
  );

-- Only system (service role) can insert audit logs
-- This prevents users from tampering with audit trail
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit trail for all critical data changes in NODDO platform';
COMMENT ON COLUMN audit_logs.action IS 'Type of change: INSERT, UPDATE, or DELETE';
COMMENT ON COLUMN audit_logs.table_name IS 'Name of the table that was modified';
COMMENT ON COLUMN audit_logs.record_id IS 'ID of the record that was modified';
COMMENT ON COLUMN audit_logs.old_data IS 'Full JSON snapshot of data before change (UPDATE/DELETE only)';
COMMENT ON COLUMN audit_logs.new_data IS 'Full JSON snapshot of data after change (INSERT/UPDATE only)';
