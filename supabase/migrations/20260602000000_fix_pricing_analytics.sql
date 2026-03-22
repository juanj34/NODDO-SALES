-- Fix pricing analytics: trigger snapshot, RPC total_revenue, and backfill precio_venta
--
-- Problems fixed:
-- 1. Trigger captured NEW.precio instead of COALESCE(NEW.precio_venta, NEW.precio)
-- 2. total_revenue RPC used SUM(DISTINCT u.precio) instead of precio_venta/snapshot
-- 3. Existing vendida units may have NULL precio_venta (pre-feature data)

-- ============================================================================
-- 1. Fix trigger to capture precio_venta in snapshot
-- ============================================================================

CREATE OR REPLACE FUNCTION track_unidad_state_change()
RETURNS TRIGGER AS $$
BEGIN
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
      COALESCE(NEW.precio_venta, NEW.precio),
      NEW.area_m2,
      (SELECT nombre FROM tipologias WHERE id = NEW.tipologia_id),
      NEW.identificador,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Fix analytics_financial_summary RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION analytics_financial_summary(
  p_proyecto_id UUID,
  p_from TIMESTAMPTZ,
  p_to TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  moneda TEXT;
BEGIN
  SELECT moneda_base INTO moneda FROM proyectos WHERE id = p_proyecto_id;

  SELECT json_build_object(
    -- Ingresos totales: usa precio_venta (bloqueado) > precio_snapshot > precio
    'total_revenue', (
      SELECT COALESCE(SUM(revenue), 0) FROM (
        SELECT DISTINCT ON (u.id)
          COALESCE(u.precio_venta, h.precio_snapshot, u.precio) AS revenue
        FROM unidades u
        JOIN unidad_state_history h ON h.unidad_id = u.id
          AND h.estado_nuevo = 'vendida'
          AND h.created_at >= p_from
          AND h.created_at <= p_to
        WHERE u.proyecto_id = p_proyecto_id
          AND u.estado = 'vendida'
      ) sub
    ),

    -- Valor del inventario disponible
    'available_inventory_value', (
      SELECT COALESCE(SUM(precio), 0)
      FROM unidades
      WHERE proyecto_id = p_proyecto_id AND estado = 'disponible'
    ),

    -- Valor del inventario reservado
    'reservada_inventory_value', (
      SELECT COALESCE(SUM(precio), 0)
      FROM unidades
      WHERE proyecto_id = p_proyecto_id AND estado = 'reservada'
    ),

    -- Ritmo de ventas: unidades vendidas por mes
    'sales_velocity', (
      SELECT COALESCE(
        COUNT(DISTINCT h.unidad_id)::FLOAT /
        GREATEST(EXTRACT(EPOCH FROM (p_to - p_from)) / 2592000, 1),
        0
      )
      FROM unidad_state_history h
      WHERE h.proyecto_id = p_proyecto_id
        AND h.estado_nuevo = 'vendida'
        AND h.created_at >= p_from
        AND h.created_at <= p_to
    ),

    -- Ingresos agrupados por mes (usa precio_venta cuando disponible)
    'monthly_revenue', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'month', to_char(date_trunc('month', h.created_at), 'YYYY-MM'),
          'revenue', SUM(COALESCE(u.precio_venta, h.precio_snapshot)),
          'count', COUNT(*)
        ) ORDER BY date_trunc('month', h.created_at)
      ), '[]'::json)
      FROM unidad_state_history h
      JOIN unidades u ON u.id = h.unidad_id
      WHERE h.proyecto_id = p_proyecto_id
        AND h.estado_nuevo = 'vendida'
        AND h.created_at >= p_from
        AND h.created_at <= p_to
      GROUP BY date_trunc('month', h.created_at)
    ),

    -- Detalle de unidades vendidas (usa precio_venta cuando disponible)
    'units_sold_detail', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'unidad_id', h.unidad_id,
          'identificador', h.identificador_snapshot,
          'tipologia', h.tipologia_snapshot,
          'precio', COALESCE(u.precio_venta, h.precio_snapshot),
          'area_m2', h.area_m2_snapshot,
          'sold_at', h.created_at,
          'month', to_char(h.created_at, 'YYYY-MM')
        ) ORDER BY h.created_at DESC
      ), '[]'::json)
      FROM unidad_state_history h
      JOIN unidades u ON u.id = h.unidad_id
      WHERE h.proyecto_id = p_proyecto_id
        AND h.estado_nuevo = 'vendida'
        AND h.created_at >= p_from
        AND h.created_at <= p_to
    ),

    -- Metadata
    'currency', moneda,
    'total_units', (SELECT COUNT(*) FROM unidades WHERE proyecto_id = p_proyecto_id),
    'disponible_count', (SELECT COUNT(*) FROM unidades WHERE proyecto_id = p_proyecto_id AND estado = 'disponible'),
    'vendida_count', (SELECT COUNT(*) FROM unidades WHERE proyecto_id = p_proyecto_id AND estado = 'vendida'),
    'reservada_count', (SELECT COUNT(*) FROM unidades WHERE proyecto_id = p_proyecto_id AND estado = 'reservada')
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. Backfill precio_venta for existing vendida units that lack it
-- ============================================================================

UPDATE unidades u
SET precio_venta = COALESCE(
  (SELECT h.precio_snapshot
   FROM unidad_state_history h
   WHERE h.unidad_id = u.id AND h.estado_nuevo = 'vendida'
   ORDER BY h.created_at DESC LIMIT 1),
  u.precio
)
WHERE u.estado = 'vendida' AND u.precio_venta IS NULL;
