-- Add Cloudflare Stream fields to videos table
ALTER TABLE videos
  ADD COLUMN IF NOT EXISTS stream_uid TEXT,
  ADD COLUMN IF NOT EXISTS stream_status TEXT,
  ADD COLUMN IF NOT EXISTS duration REAL,
  ADD COLUMN IF NOT EXISTS size_bytes BIGINT;
