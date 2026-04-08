-- Expand recursos.tipo to include more document types
ALTER TABLE recursos DROP CONSTRAINT IF EXISTS recursos_tipo_check;
ALTER TABLE recursos ADD CONSTRAINT recursos_tipo_check
  CHECK (tipo IN (
    'brochure',
    'ficha_tecnica',
    'acabados',
    'precios',
    'planos',
    'render',
    'manual',
    'reglamento',
    'garantias',
    'otro'
  ));
