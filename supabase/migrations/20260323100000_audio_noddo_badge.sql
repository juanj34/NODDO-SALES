-- Add background audio and Noddo badge control to proyectos
ALTER TABLE proyectos
  ADD COLUMN background_audio_url TEXT,
  ADD COLUMN hide_noddo_badge BOOLEAN NOT NULL DEFAULT false;
