-- Add price audit fields to tipologias table
ALTER TABLE tipologias
  ADD COLUMN precio_actualizado_en timestamptz,
  ADD COLUMN precio_actualizado_por text;

-- Add comment explaining these fields
COMMENT ON COLUMN tipologias.precio_actualizado_en IS 'Última fecha en que se modificó el precio_desde';
COMMENT ON COLUMN tipologias.precio_actualizado_por IS 'Email del usuario que modificó el precio por última vez';

-- Create index for faster queries when filtering by recent price updates
CREATE INDEX idx_tipologias_precio_actualizado_en ON tipologias(precio_actualizado_en DESC);
