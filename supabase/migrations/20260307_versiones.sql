-- Version snapshots for publish history
-- Each publish creates a JSONB snapshot of the entire project state

CREATE TABLE IF NOT EXISTS proyecto_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  published_by UUID REFERENCES auth.users(id),
  UNIQUE(proyecto_id, version_number)
);

ALTER TABLE proyecto_versiones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner read versiones"
  ON proyecto_versiones FOR SELECT
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE POLICY "Owner insert versiones"
  ON proyecto_versiones FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND auth.uid() = user_id));

CREATE INDEX idx_versiones_proyecto_id ON proyecto_versiones(proyecto_id);
