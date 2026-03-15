-- Migration: Update plan system from basic/premium to proyecto/studio
-- Date: 2026-04-15
-- Description: Migrates to new all-inclusive "Proyecto/Studio/Enterprise" pricing model
-- All plans now include ALL features (videos, maps, tours, analytics, etc.)

-- Step 1: Drop existing plan constraint
ALTER TABLE user_plans
DROP CONSTRAINT IF EXISTS user_plans_plan_check;

-- Step 2: Migrate existing plan values to new system
UPDATE user_plans
SET plan = CASE
  WHEN plan = 'basic' THEN 'proyecto'
  WHEN plan = 'premium' THEN 'studio'
  WHEN plan = 'enterprise' THEN 'enterprise'
  ELSE 'proyecto'  -- fallback for any unknown plans
END;

-- Step 3: Update limits for migrated plans (all-inclusive model)
UPDATE user_plans
SET
  max_projects = CASE
    WHEN plan = 'proyecto' THEN 1
    WHEN plan = 'studio' THEN 5
    WHEN plan = 'enterprise' THEN 999
  END,
  max_units_per_project = NULL,  -- unlimited for ALL plans
  max_collaborators = 999;        -- unlimited for ALL plans

-- Step 4: Add new plan constraint with proyecto/studio/enterprise
ALTER TABLE user_plans
ADD CONSTRAINT user_plans_plan_check
CHECK (plan IN ('proyecto', 'studio', 'enterprise'));

-- Step 5: Update storage limits in proyectos table based on new plan tiers
UPDATE proyectos p
SET storage_limit_bytes = CASE
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'proyecto'
    THEN 53687091200      -- 50GB
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'studio'
    THEN 268435456000     -- 250GB
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'enterprise'
    THEN 536870912000     -- 500GB
  ELSE 53687091200        -- Default to 50GB
END
WHERE EXISTS (SELECT 1 FROM user_plans WHERE user_id = p.user_id);

-- Step 6: Update comment explaining new all-inclusive plan system
COMMENT ON COLUMN user_plans.plan IS 'Plan tier: proyecto ($149/mo, 1 project, all features), studio ($399/mo, 5 projects, all features), or enterprise (custom pricing, unlimited)';

-- Step 7: Add index on storage_limit_bytes for quota checks
CREATE INDEX IF NOT EXISTS idx_proyectos_storage_limit ON proyectos(storage_limit_bytes);
