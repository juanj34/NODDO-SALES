-- RPC function to atomically increment storage_media_bytes on a project
CREATE OR REPLACE FUNCTION increment_storage_media_bytes(p_id UUID, p_bytes BIGINT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE proyectos
  SET storage_media_bytes = COALESCE(storage_media_bytes, 0) + p_bytes
  WHERE id = p_id;
$$;
