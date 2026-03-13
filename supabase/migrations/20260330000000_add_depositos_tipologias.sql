-- Add depositos column to tipologias table
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS depositos integer;
