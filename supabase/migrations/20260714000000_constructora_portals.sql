-- Constructora portals: centralized page for developers with multiple projects
CREATE TABLE constructora_portals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  descripcion TEXT,
  color_primario TEXT DEFAULT '#b8973a',
  layout TEXT NOT NULL DEFAULT 'slider' CHECK (layout IN ('slider', 'grid')),
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  proyecto_ids UUID[],
  hero_video_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for subdomain/slug lookup
CREATE INDEX idx_portals_slug ON constructora_portals(slug);
CREATE INDEX idx_portals_user_id ON constructora_portals(user_id);
CREATE INDEX idx_portals_custom_domain ON constructora_portals(custom_domain) WHERE custom_domain IS NOT NULL;

-- RLS
ALTER TABLE constructora_portals ENABLE ROW LEVEL SECURITY;

-- Public read for published portals (anyone can view)
CREATE POLICY "portals_public_read" ON constructora_portals
  FOR SELECT USING (true);

-- Only owner can insert/update/delete
CREATE POLICY "portals_owner_write" ON constructora_portals
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
