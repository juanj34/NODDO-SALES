-- Storage tracking per project
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS storage_tours_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_videos_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_media_bytes BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 5368709120; -- 5GB default
