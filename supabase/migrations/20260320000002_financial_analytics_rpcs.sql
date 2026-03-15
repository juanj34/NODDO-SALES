-- RPC function para calcular métricas financieras de un proyecto
-- Retorna JSON con ingresos totales, inventario disponible, ritmo de ventas, revenue mensual, etc.

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
  -- Obtener moneda del proyecto
  SELECT moneda_base INTO moneda FROM proyectos WHERE id = p_proyecto_id;

  SELECT json_build_object(
    -- Ingresos totales: suma de precios de unidades vendidas en el período
    'total_revenue', (
      SELECT COALESCE(SUM(DISTINCT u.precio), 0)
      FROM unidades u
      WHERE u.proyecto_id = p_proyecto_id
        AND u.estado = 'vendida'
        AND EXISTS (
          SELECT 1 FROM unidad_state_history h
          WHERE h.unidad_id = u.id
            AND h.estado_nuevo = 'vendida'
            AND h.created_at >= p_from
            AND h.created_at <= p_to
        )
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
        GREATEST(EXTRACT(EPOCH FROM (p_to - p_from)) / 2592000, 1), -- 2592000 = 30 días
        0
      )
      FROM unidad_state_history h
      WHERE h.proyecto_id = p_proyecto_id
        AND h.estado_nuevo = 'vendida'
        AND h.created_at >= p_from
        AND h.created_at <= p_to
    ),

    -- Ingresos agrupados por mes
    'monthly_revenue', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'month', to_char(date_trunc('month', h.created_at), 'YYYY-MM'),
          'revenue', SUM(h.precio_snapshot),
          'count', COUNT(*)
        ) ORDER BY date_trunc('month', h.created_at)
      ), '[]'::json)
      FROM unidad_state_history h
      WHERE h.proyecto_id = p_proyecto_id
        AND h.estado_nuevo = 'vendida'
        AND h.created_at >= p_from
        AND h.created_at <= p_to
      GROUP BY date_trunc('month', h.created_at)
    ),

    -- Detalle de unidades vendidas en el período
    'units_sold_detail', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'unidad_id', h.unidad_id,
          'identificador', h.identificador_snapshot,
          'tipologia', h.tipologia_snapshot,
          'precio', h.precio_snapshot,
          'area_m2', h.area_m2_snapshot,
          'sold_at', h.created_at,
          'month', to_char(h.created_at, 'YYYY-MM')
        ) ORDER BY h.created_at DESC
      ), '[]'::json)
      FROM unidad_state_history h
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

COMMENT ON FUNCTION analytics_financial_summary IS 'Calculate financial metrics for a project: total revenue, inventory value, sales velocity, monthly breakdown';
