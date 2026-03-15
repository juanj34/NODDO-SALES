-- ---------------------------------------------------------------------------
-- Independent parking & storage modes
-- Replace single complementos_mode with parqueaderos_mode + depositos_mode
-- ---------------------------------------------------------------------------

-- 1. Add new independent mode columns
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS parqueaderos_mode TEXT DEFAULT 'sin_inventario'
    CHECK (parqueaderos_mode IN ('sin_inventario', 'inventario_incluido', 'inventario_separado')),
  ADD COLUMN IF NOT EXISTS depositos_mode TEXT DEFAULT 'sin_inventario'
    CHECK (depositos_mode IN ('sin_inventario', 'inventario_incluido', 'inventario_separado'));

-- 2. Migrate existing data from complementos_mode
UPDATE proyectos SET
  parqueaderos_mode = CASE
    WHEN complementos_mode = 'separado' THEN 'inventario_separado'
    ELSE 'sin_inventario'
  END,
  depositos_mode = CASE
    WHEN complementos_mode = 'separado' THEN 'inventario_separado'
    ELSE 'sin_inventario'
  END
WHERE complementos_mode IS NOT NULL;

-- 3. Drop old column
ALTER TABLE proyectos DROP COLUMN IF EXISTS complementos_mode;
