-- ---------------------------------------------------------------------------
-- Add precio_base mode for complementos
-- Allows pricing without individual inventory (count × base price)
-- ---------------------------------------------------------------------------

-- 1. Drop existing CHECK constraints on mode columns and re-create with 'precio_base'
DO $$
DECLARE
  cname TEXT;
BEGIN
  -- Drop parqueaderos_mode CHECK
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'proyectos'::regclass
      AND att.attname = 'parqueaderos_mode'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE proyectos DROP CONSTRAINT %I', cname);
  END LOOP;

  -- Drop depositos_mode CHECK
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE con.conrelid = 'proyectos'::regclass
      AND att.attname = 'depositos_mode'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE proyectos DROP CONSTRAINT %I', cname);
  END LOOP;
END $$;

-- 2. Re-create CHECK constraints including 'precio_base'
ALTER TABLE proyectos
  ADD CONSTRAINT proyectos_parqueaderos_mode_check
    CHECK (parqueaderos_mode IN ('sin_inventario', 'inventario_incluido', 'inventario_separado', 'precio_base'));

ALTER TABLE proyectos
  ADD CONSTRAINT proyectos_depositos_mode_check
    CHECK (depositos_mode IN ('sin_inventario', 'inventario_incluido', 'inventario_separado', 'precio_base'));

-- 3. Add base price columns
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS parqueaderos_precio_base DECIMAL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS depositos_precio_base DECIMAL DEFAULT NULL;
