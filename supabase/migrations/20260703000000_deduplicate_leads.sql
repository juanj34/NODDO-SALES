-- Remove duplicate leads (keep the oldest one per email+proyecto_id)
DELETE FROM leads
WHERE id NOT IN (
  SELECT DISTINCT ON (proyecto_id, lower(email)) id
  FROM leads
  ORDER BY proyecto_id, lower(email), created_at ASC
);

-- Create unique index to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_unique_email_proyecto
  ON leads (proyecto_id, lower(email));
