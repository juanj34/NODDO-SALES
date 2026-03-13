-- Platform admin allowlist (NODDO team members)
CREATE TABLE IF NOT EXISTS platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nombre text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- User subscription plans
CREATE TABLE IF NOT EXISTS user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'proyecto', 'studio', 'enterprise')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled', 'suspended')),
  max_projects int NOT NULL DEFAULT 1,
  max_units_per_project int DEFAULT 200,
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

-- Platform admins can read their own row
CREATE POLICY "platform_admins_self_read" ON platform_admins
  FOR SELECT USING (auth.uid() = user_id);

-- Platform admins can manage all platform_admins
CREATE POLICY "platform_admins_manage_all" ON platform_admins
  FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins pa WHERE pa.user_id = auth.uid())
  );

-- Users can read their own plan
CREATE POLICY "user_plans_self_read" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

-- Platform admins can manage all plans
CREATE POLICY "user_plans_platform_admin_all" ON user_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );
