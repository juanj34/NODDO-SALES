-- Webhooks module: configurable webhook dispatch for leads and cotizaciones
-- Enables integration with Zapier, Make, n8n, and CRMs

-- 1. Add webhook_config JSONB column to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS webhook_config JSONB DEFAULT NULL;

COMMENT ON COLUMN proyectos.webhook_config IS 'Webhook config: { enabled, url, secret, events[] }';

-- 2. Webhook delivery logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  url TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  error TEXT,
  delivered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner select webhook_logs"
  ON webhook_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Collaborator select webhook_logs"
  ON webhook_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    JOIN colaboradores c ON c.admin_user_id = p.user_id
    WHERE p.id = proyecto_id
    AND c.colaborador_user_id = auth.uid()
    AND c.estado = 'activo'
  ));

-- Service role can insert logs (webhooks fire from public API routes)
CREATE POLICY "Service insert webhook_logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_logs_proyecto_id ON webhook_logs(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- 5. Auto-cleanup trigger: keep last 100 logs per project
CREATE OR REPLACE FUNCTION trigger_cleanup_webhook_logs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM webhook_logs
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
      FROM webhook_logs
      WHERE proyecto_id = NEW.proyecto_id
    ) sub
    WHERE rn > 100
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER webhook_logs_cleanup
  AFTER INSERT ON webhook_logs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_webhook_logs();
