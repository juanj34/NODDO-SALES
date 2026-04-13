-- Fix: tipologia_precio_historial has RLS enabled but NO policies
-- This blocks ALL operations, causing autosave errors for every user.

-- Collaborators can insert/read via admin's project ownership
CREATE POLICY "Users insert own precio historial"
  ON tipologia_precio_historial FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tipologias t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE t.id = tipologia_id
      AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users read own precio historial"
  ON tipologia_precio_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tipologias t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE t.id = tipologia_precio_historial.tipologia_id
      AND p.user_id = auth.uid()
    )
  );

-- Platform admins full access
CREATE POLICY "Platform admins manage precio historial"
  ON tipologia_precio_historial FOR ALL
  USING (
    EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
  );
