-- Fix RLS policy for colaboradores INSERT operations
-- FOR ALL with only USING doesn't work for INSERT — need WITH CHECK

DROP POLICY IF EXISTS "Admin manage colaboradores" ON colaboradores;

CREATE POLICY "Admin manage colaboradores"
  ON colaboradores FOR ALL
  USING (auth.uid() = admin_user_id)
  WITH CHECK (auth.uid() = admin_user_id);
