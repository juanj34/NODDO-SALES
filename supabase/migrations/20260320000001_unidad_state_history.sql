-- Tabla de historial de cambios de estado de unidades
-- Permite rastrear CUÁNDO y QUIÉN cambió el estado de cada unidad (disponible → separado → reservada → vendida)

CREATE TABLE unidad_state_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidad_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,

  -- Transición de estado
  estado_anterior TEXT CHECK (estado_anterior IN ('disponible', 'separado', 'reservada', 'vendida')),
  estado_nuevo TEXT NOT NULL CHECK (estado_nuevo IN ('disponible', 'separado', 'reservada', 'vendida')),

  -- Snapshot financiero al momento del cambio
  precio_snapshot DECIMAL,
  area_m2_snapshot FLOAT,
  tipologia_snapshot TEXT,
  identificador_snapshot TEXT,

  -- Metadata del cambio
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para queries rápidas
CREATE INDEX idx_history_unidad ON unidad_state_history(unidad_id);
CREATE INDEX idx_history_proyecto_created ON unidad_state_history(proyecto_id, created_at DESC);
CREATE INDEX idx_history_proyecto_estado ON unidad_state_history(proyecto_id, estado_nuevo);
CREATE INDEX idx_history_created ON unidad_state_history(created_at DESC);

-- RLS Policies
ALTER TABLE unidad_state_history ENABLE ROW LEVEL SECURITY;

-- Owner + collaborators pueden leer el historial
CREATE POLICY "Authorized select unidad_state_history"
  ON unidad_state_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND is_project_authorized(p.user_id)
  ));

-- Sistema puede insertar (via trigger)
CREATE POLICY "System insert unidad_state_history"
  ON unidad_state_history FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE unidad_state_history IS 'Tracks all state changes of unidades for financial analytics and audit trail';

-- Función trigger para registrar automáticamente cambios de estado
CREATE OR REPLACE FUNCTION track_unidad_state_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo registrar si el estado realmente cambió
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO unidad_state_history (
      unidad_id,
      proyecto_id,
      estado_anterior,
      estado_nuevo,
      precio_snapshot,
      area_m2_snapshot,
      tipologia_snapshot,
      identificador_snapshot,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.proyecto_id,
      OLD.estado,
      NEW.estado,
      NEW.precio,
      NEW.area_m2,
      (SELECT nombre FROM tipologias WHERE id = NEW.tipologia_id),
      NEW.identificador,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger a la tabla unidades
CREATE TRIGGER unidad_state_change_trigger
  AFTER UPDATE ON unidades
  FOR EACH ROW
  EXECUTE FUNCTION track_unidad_state_change();

COMMENT ON FUNCTION track_unidad_state_change() IS 'Auto-logs unidad state changes to unidad_state_history';

-- Backfill: crear historial para unidades ya vendidas/reservadas/separadas
-- Usamos created_at de la unidad como proxy de la fecha de cambio
INSERT INTO unidad_state_history (
  unidad_id,
  proyecto_id,
  estado_anterior,
  estado_nuevo,
  precio_snapshot,
  area_m2_snapshot,
  tipologia_snapshot,
  identificador_snapshot,
  created_at
)
SELECT
  u.id,
  u.proyecto_id,
  'disponible'::TEXT, -- Asumir que todas partieron de disponible
  u.estado,
  u.precio,
  u.area_m2,
  t.nombre,
  u.identificador,
  u.created_at -- Usar fecha de creación como proxy
FROM unidades u
LEFT JOIN tipologias t ON t.id = u.tipologia_id
WHERE u.estado IN ('vendida', 'reservada', 'separado')
ON CONFLICT DO NOTHING;
