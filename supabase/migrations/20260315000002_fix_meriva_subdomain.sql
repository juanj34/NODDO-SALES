-- Fix Meriva project subdomain to match slug
-- This is a one-time fix for projects that got out of sync
UPDATE proyectos
SET subdomain = 'meriva', updated_at = NOW()
WHERE slug = 'meriva' AND subdomain = 'peace-avenue';
