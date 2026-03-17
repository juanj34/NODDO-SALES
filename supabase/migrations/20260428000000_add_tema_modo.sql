-- Add tema_modo column for light/dark theme support per project
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS tema_modo TEXT DEFAULT 'oscuro';
