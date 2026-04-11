-- ============================================
-- Plan System: Básico / Pro per-project plans
-- ============================================
-- Adds per-project plan column, invoices table, billing events table.
-- Migrates user_plans from proyecto/studio/enterprise to basico/pro/enterprise.

-- Step 1: Add plan column to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'basico'
  CHECK (plan IN ('basico', 'pro'));

-- Backfill: give existing projects 'pro' so they keep all features
UPDATE proyectos SET plan = 'pro' WHERE plan = 'basico';

-- Step 2: Update user_plans constraint
ALTER TABLE user_plans
  DROP CONSTRAINT IF EXISTS user_plans_plan_check;

UPDATE user_plans
SET plan = CASE
  WHEN plan = 'proyecto' THEN 'pro'
  WHEN plan = 'studio' THEN 'pro'
  WHEN plan = 'basic' THEN 'basico'
  WHEN plan = 'premium' THEN 'pro'
  WHEN plan = 'enterprise' THEN 'enterprise'
  ELSE 'basico'
END;

ALTER TABLE user_plans
  ADD CONSTRAINT user_plans_plan_check
  CHECK (plan IN ('basico', 'pro', 'enterprise'));

-- Step 3: Fix payments table plan constraint (was never updated from basic/premium)
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_plan_check;

UPDATE payments
SET plan = CASE
  WHEN plan = 'basic' THEN 'basico'
  WHEN plan = 'premium' THEN 'pro'
  WHEN plan = 'proyecto' THEN 'pro'
  WHEN plan = 'studio' THEN 'pro'
  WHEN plan = 'enterprise' THEN 'enterprise'
  ELSE 'basico'
END;

ALTER TABLE payments
  ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('basico', 'pro', 'enterprise'));

-- Step 4: Update storage limits based on new project plan
UPDATE proyectos
SET storage_limit_bytes = CASE
  WHEN plan = 'basico' THEN 10737418240   -- 10GB
  WHEN plan = 'pro' THEN 53687091200      -- 50GB
  ELSE 53687091200
END;

-- Step 5: Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proyecto_id uuid REFERENCES proyectos(id) ON DELETE SET NULL,
  invoice_number text UNIQUE NOT NULL,
  plan text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  billing_period_start timestamptz,
  billing_period_end timestamptz,
  due_date timestamptz,
  paid_at timestamptz,
  payment_method text,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_proyecto_id ON invoices(proyecto_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Platform admins manage all invoices') THEN
    CREATE POLICY "Platform admins manage all invoices" ON invoices FOR ALL USING (
      EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoices' AND policyname = 'Users read own invoices') THEN
    CREATE POLICY "Users read own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 6: Create billing_events table (audit trail)
CREATE TABLE IF NOT EXISTS billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);

ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_events' AND policyname = 'Platform admins manage all billing events') THEN
    CREATE POLICY "Platform admins manage all billing events" ON billing_events FOR ALL USING (
      EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'billing_events' AND policyname = 'Users read own billing events') THEN
    CREATE POLICY "Users read own billing events" ON billing_events FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Step 7: Index on proyectos.plan for filtering
CREATE INDEX IF NOT EXISTS idx_proyectos_plan ON proyectos(plan);

COMMENT ON COLUMN proyectos.plan IS 'Project plan tier: basico ($199/mo) or pro ($249/mo). Controls feature access.';
COMMENT ON TABLE invoices IS 'Billing invoices for project subscriptions. Managed by platform admins.';
COMMENT ON TABLE billing_events IS 'Audit trail for all billing-related events (plan changes, payments, reminders).';
