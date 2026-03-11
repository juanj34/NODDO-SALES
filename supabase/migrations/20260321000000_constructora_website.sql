-- Add constructora_website column to proyectos
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS constructora_website TEXT;
