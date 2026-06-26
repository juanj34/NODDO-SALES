-- ============================================================
-- Migration: Private bucket `cotizaciones` for quote PDFs
-- Replaces the dead writes to the non-existent `uploads` bucket.
-- PDFs contain buyer PII → bucket is PRIVATE; access via signed URLs only.
-- Read scoped to project owner/active-collaborator; writes via service-role.
-- ============================================================

-- 1. Create the private bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cotizaciones', 'cotizaciones', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. RLS read policy: object key is `{proyecto_id}/{cotizacion_id}.pdf`.
--    The first folder segment is the proyecto_id. Authorize the requester
--    against that project's owner via the existing is_project_authorized() helper.
DROP POLICY IF EXISTS "Authorized read cotizaciones PDFs" ON storage.objects;
CREATE POLICY "Authorized read cotizaciones PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cotizaciones'
    AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND is_project_authorized(p.user_id)
    )
  );

-- 3. No INSERT/UPDATE/DELETE policies for authenticated/anon:
--    the service-role key bypasses RLS, so generate.ts (service-role) writes
--    and overwrites freely while no public client can write or read directly.
--    Reads from the dashboard go through service-role signed URLs (see generate.ts).

COMMENT ON POLICY "Authorized read cotizaciones PDFs" ON storage.objects
  IS 'Project owner or active collaborator may read quote PDFs for their project; bucket is otherwise private.';
