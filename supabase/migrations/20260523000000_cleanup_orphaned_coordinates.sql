-- Clean up orphaned fachada coordinates (fachada_id was set to NULL by cascade
-- but fachada_x/fachada_y were not cleared)
UPDATE unidades SET fachada_x = NULL, fachada_y = NULL
WHERE fachada_id IS NULL AND (fachada_x IS NOT NULL OR fachada_y IS NOT NULL);

-- Clean up orphaned planta coordinates
UPDATE unidades SET planta_x = NULL, planta_y = NULL
WHERE planta_id IS NULL AND (planta_x IS NOT NULL OR planta_y IS NOT NULL);
