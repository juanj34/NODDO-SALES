-- Add tipo field to torres: "torre" (vertical building) or "urbanismo" (horizontal housing)
ALTER TABLE torres
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'torre'
  CHECK (tipo IN ('torre', 'urbanismo'));
