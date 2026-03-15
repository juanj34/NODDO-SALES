-- Add moneda_base and unidad_medida_base columns
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moneda_base TEXT DEFAULT 'COP'
    CHECK (moneda_base IN ('COP', 'USD', 'AED', 'MXN', 'EUR')),
  ADD COLUMN IF NOT EXISTS unidad_medida_base TEXT DEFAULT 'm2'
    CHECK (unidad_medida_base IN ('m2', 'sqft'));

-- Set defaults for existing projects
UPDATE proyectos
SET moneda_base = 'COP', unidad_medida_base = 'm2'
WHERE moneda_base IS NULL OR unidad_medida_base IS NULL;
