-- Add 'addon' to complementos tipo CHECK constraint
-- Allows generic add-ons (e.g., furniture gifts) beyond parqueaderos/depósitos

ALTER TABLE complementos DROP CONSTRAINT IF EXISTS complementos_tipo_check;
ALTER TABLE complementos ADD CONSTRAINT complementos_tipo_check
  CHECK (tipo IN ('parqueadero', 'deposito', 'addon'));
