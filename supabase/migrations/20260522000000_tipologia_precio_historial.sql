-- Create tipologia price history table
CREATE TABLE tipologia_precio_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipologia_id uuid NOT NULL REFERENCES tipologias(id) ON DELETE CASCADE,
  precio_anterior numeric,
  precio_nuevo numeric NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text NOT NULL,
  notas text,
  created_at timestamptz DEFAULT now()
);

-- Create index for fast queries by tipologia
CREATE INDEX idx_precio_historial_tipologia ON tipologia_precio_historial(tipologia_id, changed_at DESC);

-- Add RLS policies (same as parent table - admin only)
ALTER TABLE tipologia_precio_historial ENABLE ROW LEVEL SECURITY;

-- Comment
COMMENT ON TABLE tipologia_precio_historial IS 'Historial completo de cambios de precio en tipologías';
