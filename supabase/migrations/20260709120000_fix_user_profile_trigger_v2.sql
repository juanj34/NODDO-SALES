-- Fix user_profile trigger that causes "Database error saving new user"
-- when inviteUserByEmail() creates a new auth.users row.
--
-- Problems:
-- 1. Trigger function had no error handling — any failure blocks user creation
-- 2. locale column was removed from user_profiles but getUserLocale() queries it
-- 3. Trigger may not have been properly recreated after DROP TABLE CASCADE

-- Add locale column back to user_profiles (getUserLocale in email.ts queries it)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS locale VARCHAR(5) DEFAULT 'es';

-- Recreate trigger function with error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, nombre, apellido, locale)
  VALUES (NEW.id, '', '', 'es')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user creation if profile insert fails
  RAISE WARNING 'create_user_profile trigger failed for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (may have been lost or corrupted)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();
