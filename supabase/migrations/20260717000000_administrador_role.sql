-- Add "administrador" role to colaboradores
-- This is a near-admin collaborator role that can do everything except delete projects and manage billing.

ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_rol_check;

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_rol_check
  CHECK (rol IN ('administrador', 'director', 'asesor'));
