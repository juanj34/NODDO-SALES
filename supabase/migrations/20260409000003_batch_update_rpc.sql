-- ============================================================
-- Migration: Batch Update RPC for Reordering
-- Replaces sequential updates with efficient batch operations
-- Based on Supabase/Postgres best practices audit
-- ============================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Generic batch update function for orden fields
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION batch_update_orden(
  p_table_name TEXT,
  p_updates JSONB
)
RETURNS VOID AS $$
DECLARE
  rec RECORD;
  query TEXT;
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN (
    'galeria_imagenes',
    'galeria_categorias',
    'tipologias',
    'videos',
    'puntos_interes',
    'recursos',
    'fachadas',
    'torres',
    'planos_interactivos',
    'plano_puntos',
    'avances_obra',
    'unidades'
  ) THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Build UPDATE query with CASE statement for batch update
  query := format(
    'UPDATE %I SET orden = CASE id',
    p_table_name
  );

  -- Add WHEN clauses for each update
  FOR rec IN SELECT * FROM jsonb_to_recordset(p_updates) AS x(id UUID, orden INT)
  LOOP
    query := query || format(' WHEN %L THEN %s', rec.id, rec.orden);
  END LOOP;

  -- Close CASE and add WHERE clause to only update specified IDs
  query := query || ' END WHERE id IN (';

  -- Add all IDs to WHERE clause
  FOR rec IN SELECT * FROM jsonb_to_recordset(p_updates) AS x(id UUID)
  LOOP
    query := query || format('%L,', rec.id);
  END LOOP;

  -- Remove trailing comma and close query
  query := rtrim(query, ',') || ')';

  -- Execute the batch update
  EXECUTE query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION batch_update_orden IS 'Efficiently updates orden field for multiple records in a single query. Prevents N sequential updates.';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Specialized batch reorder function for galeria_imagenes (most common use case)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION batch_reorder_galeria_imagenes(p_updates JSONB)
RETURNS VOID AS $$
BEGIN
  PERFORM batch_update_orden('galeria_imagenes', p_updates);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION batch_reorder_galeria_imagenes IS 'Specialized batch reorder for gallery images. Expects JSON array: [{"id": "uuid", "orden": 1}, ...]';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Grant execute permissions
-- ══════════════════════════════════════════════════════════════════════════════

-- Only authenticated users (admins) can reorder
GRANT EXECUTE ON FUNCTION batch_update_orden TO authenticated;
GRANT EXECUTE ON FUNCTION batch_reorder_galeria_imagenes TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Example usage (comment for documentation)
-- ══════════════════════════════════════════════════════════════════════════════

/*
-- Client-side usage example:

const updates = [
  { id: 'uuid-1', orden: 0 },
  { id: 'uuid-2', orden: 1 },
  { id: 'uuid-3', orden: 2 }
];

// Using Supabase client:
await supabase.rpc('batch_reorder_galeria_imagenes', {
  p_updates: updates
});

// Or generic version for other tables:
await supabase.rpc('batch_update_orden', {
  p_table_name: 'tipologias',
  p_updates: updates
});
*/
