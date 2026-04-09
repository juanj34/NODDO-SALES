-- Fix infinite recursion in platform_admins RLS policies
-- The old "platform_admins_manage_all" policy queries platform_admins
-- inside a policy ON platform_admins, causing infinite recursion.

-- Step 1: Create a SECURITY DEFINER function that bypasses RLS
CREATE OR REPLACE FUNCTION public.is_platform_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM platform_admins WHERE user_id = check_user_id);
$$;

-- Step 2: Drop the broken policies
DROP POLICY IF EXISTS "platform_admins_manage_all" ON platform_admins;
DROP POLICY IF EXISTS "platform_admins_self_read" ON platform_admins;

-- Step 3: Recreate with the safe function
-- Any platform admin can read all rows
CREATE POLICY "platform_admins_read" ON platform_admins
  FOR SELECT USING (public.is_platform_admin(auth.uid()));

-- Any platform admin can insert/update/delete
CREATE POLICY "platform_admins_write" ON platform_admins
  FOR ALL USING (public.is_platform_admin(auth.uid()));

-- Step 4: Also fix user_plans policy that has the same issue
DROP POLICY IF EXISTS "user_plans_platform_admin_all" ON user_plans;

CREATE POLICY "user_plans_platform_admin_all" ON user_plans
  FOR ALL USING (public.is_platform_admin(auth.uid()));
