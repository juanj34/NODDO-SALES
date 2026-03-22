-- Hide price of sold units (units still visible, just price hidden)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS ocultar_precio_vendidas BOOLEAN DEFAULT false;
