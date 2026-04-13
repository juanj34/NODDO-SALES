-- Add toggle for independent gallery section per torre
ALTER TABLE torres ADD COLUMN IF NOT EXISTS galeria_independiente BOOLEAN DEFAULT false;
