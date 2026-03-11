-- ============================================================
-- Migration: Remove etapas, absorb into fachadas
-- ============================================================

-- 1. Add tower metadata columns to fachadas (absorbed from etapas)
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS num_pisos INT;
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS descripcion TEXT;
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS amenidades TEXT;
ALTER TABLE fachadas ADD COLUMN IF NOT EXISTS imagen_portada TEXT;

-- 2. Migrate data from etapas to their linked fachadas
UPDATE fachadas f SET
  num_pisos = e.num_pisos,
  descripcion = e.descripcion,
  amenidades = e.amenidades,
  imagen_portada = e.imagen_url
FROM etapas e WHERE f.etapa_id = e.id;

-- 3. Add fachada_id to plano_puntos (replaces etapa_id)
ALTER TABLE plano_puntos ADD COLUMN IF NOT EXISTS fachada_id UUID REFERENCES fachadas(id) ON DELETE SET NULL;

-- Migrate: find the fachada that belonged to the same etapa
UPDATE plano_puntos pp SET fachada_id = (
  SELECT f.id FROM fachadas f WHERE f.etapa_id = pp.etapa_id ORDER BY f.orden LIMIT 1
) WHERE pp.etapa_id IS NOT NULL;

-- 4. Drop obsolete columns
ALTER TABLE plano_puntos DROP COLUMN IF EXISTS etapa_id;
ALTER TABLE unidades DROP COLUMN IF EXISTS etapa_id;
ALTER TABLE fachadas DROP COLUMN IF EXISTS etapa_id;

-- 5. Drop etapas table and its trigger
DROP TRIGGER IF EXISTS trg_etapas_bump ON etapas;
DROP TABLE IF EXISTS etapas CASCADE;

-- 6. New index
CREATE INDEX IF NOT EXISTS idx_plano_puntos_fachada_id ON plano_puntos(fachada_id);
