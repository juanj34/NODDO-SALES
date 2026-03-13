-- Add status column to leads for CRM tracking
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'nuevo';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
