-- Add idioma (language) column to proyectos
-- Controls the language of client-facing communications: emails, PDFs, microsites

ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS idioma VARCHAR(5) DEFAULT 'es';

COMMENT ON COLUMN proyectos.idioma IS 'Language for client-facing communications (es/en)';
