-- Hide sold units from public microsite + lock price on sale
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS ocultar_vendidas BOOLEAN DEFAULT false;
ALTER TABLE unidades ADD COLUMN IF NOT EXISTS precio_venta DECIMAL DEFAULT NULL;
