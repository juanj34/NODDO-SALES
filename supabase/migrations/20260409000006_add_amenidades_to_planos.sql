-- Add amenidades_data column to planos_interactivos table
-- This enables implantaciones/urbanismos to have amenities just like torres

ALTER TABLE planos_interactivos
ADD COLUMN IF NOT EXISTS amenidades_data JSONB DEFAULT NULL;

-- No index needed initially (JSONB queries not expected to be heavy for amenidades)
-- Can add GIN index later if performance requires:
-- CREATE INDEX idx_planos_amenidades_data ON planos_interactivos USING GIN (amenidades_data);
