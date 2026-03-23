-- User profiles: extended info for admins and collaborators (name, phone, avatar)
-- Replaces the old user_profiles table (which only had id, locale)
DROP TABLE IF EXISTS user_profiles CASCADE;

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  apellido TEXT NOT NULL DEFAULT '',
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read their collaborators' profiles
CREATE POLICY "admin_read_collab_profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM colaboradores
      WHERE admin_user_id = auth.uid()
        AND colaborador_user_id = user_profiles.user_id
        AND estado = 'activo'
    )
  );

-- Service role bypass
CREATE POLICY "service_role_all" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Snapshot agent contact info on cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS agente_telefono TEXT;
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS agente_avatar_url TEXT;

-- Add user_name to activity_logs for denormalized display
ALTER TABLE activity_logs ADD COLUMN IF NOT EXISTS user_name TEXT;
