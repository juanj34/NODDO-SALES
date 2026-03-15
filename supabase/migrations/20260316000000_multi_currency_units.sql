-- Multi-Currency and Multi-Unit Support
-- Add base currency and measurement unit to proyectos
-- Create exchange_rates table for TRM caching

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Add new columns to proyectos table
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS moneda_base TEXT DEFAULT 'COP'
    CHECK (moneda_base IN ('COP', 'USD', 'AED', 'MXN', 'EUR')),
  ADD COLUMN IF NOT EXISTS unidad_medida_base TEXT DEFAULT 'm2'
    CHECK (unidad_medida_base IN ('m2', 'sqft'));

-- Add column comments
COMMENT ON COLUMN proyectos.moneda_base IS 'Base currency for all prices in editor and database';
COMMENT ON COLUMN proyectos.unidad_medida_base IS 'Base unit of measurement for areas (m2 or sqft)';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Create exchange_rates table for caching daily TRM
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'USD',
  target_currency TEXT NOT NULL,
  rate DECIMAL(12, 6) NOT NULL CHECK (rate > 0),
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'exchangerate-api.io',
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate rates for same day
  UNIQUE(base_currency, target_currency, (fetched_at::date))
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup
  ON exchange_rates(base_currency, target_currency, fetched_at DESC);

-- Table comment
COMMENT ON TABLE exchange_rates IS 'Cached daily exchange rates from external API (ExchangeRate-API.io)';

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Row Level Security (RLS) for exchange_rates
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Public read access (microsite visitors need rates)
CREATE POLICY "Public read exchange rates"
  ON exchange_rates FOR SELECT
  USING (true);

-- Server-side insert only (via API routes with service role)
CREATE POLICY "Server insert exchange rates"
  ON exchange_rates FOR INSERT
  WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Set defaults for existing projects
-- ══════════════════════════════════════════════════════════════════════════════

-- All existing projects default to COP and m2
-- If cotizador already has a moneda configured, use that instead
UPDATE proyectos
SET
  moneda_base = COALESCE(
    (cotizador_config->>'moneda')::TEXT,
    'COP'
  ),
  unidad_medida_base = 'm2'
WHERE moneda_base IS NULL OR unidad_medida_base IS NULL;
