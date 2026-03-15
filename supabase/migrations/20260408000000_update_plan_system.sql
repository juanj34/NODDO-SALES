-- Migration: Update plan system from trial/proyecto/studio to basic/premium/enterprise
-- Date: 2026-04-08
-- Description: Migrates to new all-inclusive pricing model in USD

-- Step 1: Drop existing plan constraint
ALTER TABLE user_plans
DROP CONSTRAINT IF EXISTS user_plans_plan_check;

-- Step 2: Migrate existing plan values to new system
UPDATE user_plans
SET plan = CASE
  WHEN plan = 'trial' THEN 'basic'
  WHEN plan = 'proyecto' THEN 'basic'
  WHEN plan = 'studio' THEN 'premium'
  WHEN plan = 'enterprise' THEN 'enterprise'
  ELSE 'basic'  -- fallback for any unknown plans
END;

-- Step 3: Update limits for migrated plans
UPDATE user_plans
SET
  max_projects = CASE
    WHEN plan = 'basic' THEN 1
    WHEN plan = 'premium' THEN 5
    WHEN plan = 'enterprise' THEN 999
  END,
  max_units_per_project = CASE
    WHEN plan = 'basic' THEN 200
    WHEN plan IN ('premium', 'enterprise') THEN NULL  -- unlimited
  END,
  max_collaborators = CASE
    WHEN plan IN ('basic', 'premium') THEN 5
    WHEN plan = 'enterprise' THEN 999
  END;

-- Step 4: Add new plan constraint with only basic/premium/enterprise
ALTER TABLE user_plans
ADD CONSTRAINT user_plans_plan_check
CHECK (plan IN ('basic', 'premium', 'enterprise'));

-- Step 5: Add storage_limit_bytes column to proyectos table if it doesn't exist
ALTER TABLE proyectos
ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 10737418240;  -- 10GB default

-- Step 6: Update storage limits based on user's plan
UPDATE proyectos p
SET storage_limit_bytes = CASE
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'basic'
    THEN 10737418240      -- 10GB
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'premium'
    THEN 53687091200      -- 50GB
  WHEN (SELECT plan FROM user_plans WHERE user_id = p.user_id) = 'enterprise'
    THEN 536870912000     -- 500GB
  ELSE 10737418240        -- Default to 10GB
END
WHERE EXISTS (SELECT 1 FROM user_plans WHERE user_id = p.user_id);

-- Step 7: Create index on user_plans.plan for faster queries
CREATE INDEX IF NOT EXISTS idx_user_plans_plan ON user_plans(plan);

-- Step 8: Add comment explaining new plan system
COMMENT ON COLUMN user_plans.plan IS 'Plan tier: basic ($79/mo), premium ($149/mo), or enterprise (custom pricing)';
