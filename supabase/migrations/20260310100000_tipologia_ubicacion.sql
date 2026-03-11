-- ============================================================
-- Migration: Add location thumbnail to tipologías
-- ============================================================

-- Small image showing where this unit type sits within the building footprint
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS ubicacion_plano_url TEXT DEFAULT NULL;
