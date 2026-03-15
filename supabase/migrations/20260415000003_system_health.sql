-- System Health Metrics Table
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type text NOT NULL CHECK (metric_type IN ('db_connections', 'storage_usage', 'api_errors', 'email_delivery', 'webhook_failures')),
  value numeric NOT NULL,
  status text NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_health_metrics_type ON system_health_metrics(metric_type);
CREATE INDEX idx_health_metrics_created_at ON system_health_metrics(created_at DESC);
CREATE INDEX idx_health_metrics_status ON system_health_metrics(status);

-- Auto-cleanup function: keep last 1000 entries per metric type
CREATE OR REPLACE FUNCTION cleanup_health_metrics()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM system_health_metrics
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY metric_type ORDER BY created_at DESC) AS rn
      FROM system_health_metrics
    ) sub WHERE rn > 1000
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-cleanup old metrics
CREATE TRIGGER health_metrics_cleanup
  AFTER INSERT ON system_health_metrics
  FOR EACH ROW EXECUTE FUNCTION cleanup_health_metrics();

-- Row Level Security
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Platform admins can read all health metrics
CREATE POLICY "Platform admins read health metrics"
  ON system_health_metrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Policy: System can insert health metrics (via service role)
CREATE POLICY "Service role can insert health metrics"
  ON system_health_metrics FOR INSERT
  WITH CHECK (true);
