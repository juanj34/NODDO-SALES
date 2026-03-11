-- Add domain support for multi-tenant SaaS

-- Subdomain: auto-derived from slug, powers slug.nodesites.com
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;

-- Custom domain: e.g. "altodeyeguas.com" (premium feature)
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Domain verification status for custom domains
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS domain_verified BOOLEAN DEFAULT false;

-- Populate subdomain from existing slugs
UPDATE proyectos SET subdomain = slug WHERE subdomain IS NULL;

-- Indexes for fast domain lookup in middleware (hot path)
CREATE UNIQUE INDEX IF NOT EXISTS idx_proyectos_subdomain ON proyectos(subdomain) WHERE subdomain IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_proyectos_custom_domain ON proyectos(custom_domain) WHERE custom_domain IS NOT NULL;
