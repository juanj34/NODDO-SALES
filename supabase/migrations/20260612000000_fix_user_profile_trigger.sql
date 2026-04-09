-- Fix create_user_profile trigger to match new user_profiles schema
-- The table was recreated in 20260610000000 with user_id instead of id,
-- but the trigger function still referenced (id, locale) columns.
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
