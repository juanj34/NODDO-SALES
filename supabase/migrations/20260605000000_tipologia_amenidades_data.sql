-- Add amenidades_data to tipologias (structured amenities with icons)
-- Follows same pattern as planos_interactivos.amenidades_data
ALTER TABLE tipologias
ADD COLUMN IF NOT EXISTS amenidades_data JSONB DEFAULT NULL;
