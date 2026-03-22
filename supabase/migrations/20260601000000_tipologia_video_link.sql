-- Link a video to a tipología (optional, one-to-one)
ALTER TABLE tipologias ADD COLUMN video_id uuid REFERENCES videos(id) ON DELETE SET NULL;
