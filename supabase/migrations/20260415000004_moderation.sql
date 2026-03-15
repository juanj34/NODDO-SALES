-- Content Moderation for Projects
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'approved'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moderation_notes text;

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moderated_at timestamptz;

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moderated_by uuid REFERENCES auth.users(id);

-- Index for filtering by moderation status
CREATE INDEX IF NOT EXISTS idx_proyectos_moderation ON proyectos(moderation_status);
CREATE INDEX IF NOT EXISTS idx_proyectos_moderated_at ON proyectos(moderated_at DESC);
