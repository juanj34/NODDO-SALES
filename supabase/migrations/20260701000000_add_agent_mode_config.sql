ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS agent_mode_config jsonb DEFAULT NULL;
