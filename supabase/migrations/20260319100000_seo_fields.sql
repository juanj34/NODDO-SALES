-- Add SEO fields for per-project favicon and social sharing image
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS og_image_url TEXT;
