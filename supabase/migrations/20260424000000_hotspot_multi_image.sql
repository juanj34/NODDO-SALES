-- Multi-image support for hotspots (tipologias + plano_puntos)
-- TipologiaHotspot: No migration needed (JSONB in tipologias.hotspots — new field added in TS)
-- PlanoPunto: Add renders JSONB column

ALTER TABLE plano_puntos ADD COLUMN IF NOT EXISTS renders JSONB DEFAULT '[]'::jsonb;

-- Migrate existing render_url data into renders array
UPDATE plano_puntos
SET renders = jsonb_build_array(render_url)
WHERE render_url IS NOT NULL
  AND render_url != ''
  AND (renders IS NULL OR renders = '[]'::jsonb);
