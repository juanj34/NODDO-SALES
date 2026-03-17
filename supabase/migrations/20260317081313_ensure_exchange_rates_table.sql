-- Ensure exchange_rates table exists (fix for missing table)

-- Create exchange_rates table for caching daily TRM
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate DECIMAL(12, 6) NOT NULL CHECK (rate > 0),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'exchangerate-api.io',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup
  ON public.exchange_rates(base_currency, target_currency, fetched_at DESC);

-- Table comment
COMMENT ON TABLE public.exchange_rates IS 'Cached daily exchange rates from external API (ExchangeRate-API.io)';

-- Row Level Security
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read exchange rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Server insert exchange rates" ON public.exchange_rates;

-- Public read access (microsite visitors need rates)
CREATE POLICY "Public read exchange rates"
  ON public.exchange_rates FOR SELECT
  USING (true);

-- Server-side insert only (via API routes with service role)
CREATE POLICY "Server insert exchange rates"
  ON public.exchange_rates FOR INSERT
  WITH CHECK (true);
