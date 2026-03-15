-- ============================================================
-- Migration: Enforce Storage Quotas
-- Adds quota checks to storage policies to prevent abuse
-- Based on Supabase/Postgres best practices audit
-- ============================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Helper function: Get total storage used by a user across all projects
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_total_storage_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(
    SUM(storage_tours_bytes + storage_videos_bytes + storage_media_bytes),
    0
  )
  FROM proyectos
  WHERE user_id = p_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_total_storage_bytes IS 'Returns total storage bytes used by user across all projects';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Helper function: Get user's total storage limit based on plan
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_user_storage_limit_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan
  FROM user_plans
  WHERE user_id = p_user_id;

  -- If no plan found, default to basic limits
  IF user_plan IS NULL THEN
    RETURN 10737418240; -- 10GB
  END IF;

  RETURN CASE user_plan
    WHEN 'basic' THEN 10737418240      -- 10GB
    WHEN 'premium' THEN 53687091200    -- 50GB
    WHEN 'enterprise' THEN 536870912000 -- 500GB
    ELSE 10737418240 -- Default 10GB
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_storage_limit_bytes IS 'Returns storage limit in bytes based on user plan (basic: 10GB, premium: 50GB, enterprise: 500GB)';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Helper function: Check if user can upload more files
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION user_can_upload()
RETURNS BOOLEAN AS $$
DECLARE
  current_user_id UUID;
  used_bytes BIGINT;
  limit_bytes BIGINT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  used_bytes := get_user_total_storage_bytes(current_user_id);
  limit_bytes := get_user_storage_limit_bytes(current_user_id);

  -- Allow upload if under 95% of quota (leave 5% buffer for concurrent uploads)
  RETURN used_bytes < (limit_bytes * 0.95);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION user_can_upload IS 'RLS helper: checks if authenticated user has available storage quota (under 95% of limit)';

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Update storage policies to enforce quotas
-- ══════════════════════════════════════════════════════════════════════════════

-- Drop existing permissive upload policy
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;

-- Create new policy with quota check
CREATE POLICY "Authenticated users can upload media with quota"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND user_can_upload()
  );

-- Update policy is fine as-is (only allows updating own files)
-- Delete policy is fine as-is (only allows deleting own files)

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Create RPC for client-side quota check (before upload attempt)
-- ══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_storage_quota()
RETURNS JSON AS $$
DECLARE
  current_user_id UUID;
  used_bytes BIGINT;
  limit_bytes BIGINT;
  can_upload BOOLEAN;
  percentage_used NUMERIC;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'error', 'Not authenticated',
      'can_upload', false
    );
  END IF;

  used_bytes := get_user_total_storage_bytes(current_user_id);
  limit_bytes := get_user_storage_limit_bytes(current_user_id);
  can_upload := used_bytes < (limit_bytes * 0.95);
  percentage_used := ROUND((used_bytes::NUMERIC / NULLIF(limit_bytes, 0)) * 100, 2);

  RETURN json_build_object(
    'can_upload', can_upload,
    'used_bytes', used_bytes,
    'limit_bytes', limit_bytes,
    'percentage_used', percentage_used,
    'remaining_bytes', GREATEST(0, limit_bytes - used_bytes)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION check_storage_quota IS 'Client-callable RPC to check storage quota before upload. Returns usage stats and whether upload is allowed.';

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Grant permissions
-- ══════════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION get_user_total_storage_bytes TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_storage_limit_bytes TO authenticated;
GRANT EXECUTE ON FUNCTION user_can_upload TO authenticated;
GRANT EXECUTE ON FUNCTION check_storage_quota TO authenticated;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Add index to speed up storage calculations
-- ══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_proyectos_user_storage
  ON proyectos(user_id, storage_tours_bytes, storage_videos_bytes, storage_media_bytes);

COMMENT ON INDEX idx_proyectos_user_storage IS 'Composite index for fast storage quota calculations per user';
