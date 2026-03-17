-- Multi-floor plan support for tipologias
-- Stores array of floor plans, each with its own image and hotspots
-- Structure: [{ id, nombre, plano_url, hotspots: [{id, label, x, y, render_url, renders}], orden }]
-- When pisos is NULL, legacy plano_url + hotspots fields are used (backward compat)

ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS pisos JSONB DEFAULT NULL;
