-- Add boolean fields for tipología extras (jacuzzi, piscina)
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_jacuzzi BOOLEAN DEFAULT false;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS tiene_piscina BOOLEAN DEFAULT false;
