-- Migrate tipologias from single torre_id to torre_ids array
-- This allows a tipología to be assigned to multiple torres

-- Add the new array column
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS torre_ids uuid[] DEFAULT '{}';

-- Migrate existing data: copy torre_id into torre_ids array
UPDATE tipologias
SET torre_ids = ARRAY[torre_id]
WHERE torre_id IS NOT NULL AND (torre_ids IS NULL OR torre_ids = '{}');

-- Drop the old column
ALTER TABLE tipologias DROP COLUMN IF EXISTS torre_id;
