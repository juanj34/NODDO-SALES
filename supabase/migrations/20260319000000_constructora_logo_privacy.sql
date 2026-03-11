-- Add missing constructora_logo_url column (was in types but never migrated,
-- causing the entire General save to fail with a Supabase error)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS constructora_logo_url TEXT;

-- Add privacy policy URL field
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS politica_privacidad_url TEXT;
