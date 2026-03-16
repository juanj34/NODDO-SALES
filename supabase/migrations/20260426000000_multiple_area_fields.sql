-- Add multiple area fields for casas/lotes inventory
-- area_construida: total built footprint (m²)
-- area_privada: private/usable area (m²)
-- area_lote: land lot size (m²)

ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS area_construida FLOAT;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS area_privada FLOAT;
ALTER TABLE tipologias ADD COLUMN IF NOT EXISTS area_lote FLOAT;

ALTER TABLE unidades ADD COLUMN IF NOT EXISTS area_construida FLOAT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS area_privada FLOAT;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS area_lote FLOAT;
