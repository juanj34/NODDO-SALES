-- Add structured amenidades data (JSONB) to torres
ALTER TABLE torres ADD COLUMN amenidades_data JSONB DEFAULT NULL;
