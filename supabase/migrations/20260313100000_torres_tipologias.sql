-- ============================================================
-- Migration: Torre-centric architecture
-- Adds torre_id to tipologias + prefijo to torres
-- ============================================================

-- 1. Add torre_id to tipologias (nullable for backward compat)
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS torre_id UUID REFERENCES torres(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tipologias_torre_id ON tipologias(torre_id);

-- 2. Add prefijo to torres for nomenclature system (e.g., "T1", "A")
ALTER TABLE torres ADD COLUMN IF NOT EXISTS prefijo TEXT DEFAULT NULL;
