-- Add hero video support for landing page background
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS hero_video_url TEXT;
