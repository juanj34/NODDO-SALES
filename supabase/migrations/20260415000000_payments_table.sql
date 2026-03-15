-- ============================================
-- Payments Table for Billing & Revenue Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('basic', 'premium', 'enterprise')),
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method text,
  stripe_payment_id text,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  invoice_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payments_billing_period ON payments(billing_period_end DESC);

-- RLS Policies
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage all payments
CREATE POLICY "Platform admins manage all payments"
  ON payments FOR ALL USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );

-- Users can read their own payment history
CREATE POLICY "Users read own payments"
  ON payments FOR SELECT USING (auth.uid() = user_id);
