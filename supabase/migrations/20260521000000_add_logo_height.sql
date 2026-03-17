-- Add logo_height column to proyectos table
-- This allows customizing the display size of the project logo on the landing page
-- Default value of 96 matches the new default size (lg:h-24 = 96px)

ALTER TABLE proyectos
ADD COLUMN logo_height INT DEFAULT 96 CHECK (logo_height >= 40 AND logo_height <= 240);

COMMENT ON COLUMN proyectos.logo_height IS 'Height of the project logo in pixels (40-240px, default 96px)';
