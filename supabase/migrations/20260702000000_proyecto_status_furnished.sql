-- Add construction status and furnished policy to proyectos
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS estado_construccion TEXT NOT NULL DEFAULT 'sobre_planos',
  ADD COLUMN IF NOT EXISTS politica_amoblado TEXT NOT NULL DEFAULT 'no',
  ADD COLUMN IF NOT EXISTS precio_amoblado NUMERIC;

-- Validate enum-like values
ALTER TABLE proyectos
  ADD CONSTRAINT chk_estado_construccion CHECK (estado_construccion IN ('sobre_planos', 'en_construccion', 'entregado')),
  ADD CONSTRAINT chk_politica_amoblado CHECK (politica_amoblado IN ('incluido', 'opcional', 'no'));
