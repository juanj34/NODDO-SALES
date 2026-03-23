-- Email configuration for project-branded emails (cotización, lead confirmation)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS email_config JSONB DEFAULT NULL;

COMMENT ON COLUMN proyectos.email_config IS 'JSONB config for branded buyer emails: reply_to, logos, custom text, attachments, action buttons';
