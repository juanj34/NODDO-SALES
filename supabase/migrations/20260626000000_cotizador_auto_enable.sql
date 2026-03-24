-- Auto-enable cotizador for all projects that have config set
UPDATE proyectos
SET cotizador_enabled = true
WHERE cotizador_config IS NOT NULL
  AND cotizador_enabled = false;
