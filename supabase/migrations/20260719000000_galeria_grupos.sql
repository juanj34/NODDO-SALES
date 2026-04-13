-- Gallery groups: independent from torres, only affect gallery organization
CREATE TABLE IF NOT EXISTS galeria_grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID REFERENCES proyectos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_galeria_grupos_proyecto_id ON galeria_grupos(proyecto_id);

-- RLS
ALTER TABLE galeria_grupos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized select galeria_grupos"
  ON galeria_grupos FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos p
    WHERE p.id = proyecto_id
    AND (p.estado = 'publicado' OR is_project_authorized(p.user_id))
  ));

CREATE POLICY "Content writer insert galeria_grupos"
  ON galeria_grupos FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer update galeria_grupos"
  ON galeria_grupos FOR UPDATE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

CREATE POLICY "Content writer delete galeria_grupos"
  ON galeria_grupos FOR DELETE
  USING (EXISTS (SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_content_writer(user_id)));

-- Bump trigger
CREATE TRIGGER trg_galeria_grupos_bump
  AFTER INSERT OR UPDATE OR DELETE ON galeria_grupos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

-- Add galeria_grupo_id to galeria_categorias
ALTER TABLE galeria_categorias
  ADD COLUMN IF NOT EXISTS galeria_grupo_id UUID REFERENCES galeria_grupos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_galeria_categorias_grupo_id
  ON galeria_categorias(galeria_grupo_id);

-- Data migration: move gallery-only torres into galeria_grupos
INSERT INTO galeria_grupos (id, proyecto_id, nombre, orden, created_at)
SELECT id, proyecto_id, nombre, orden, created_at
FROM torres
WHERE galeria_independiente = true;

-- Re-point categories from torre_id to galeria_grupo_id
UPDATE galeria_categorias gc
SET galeria_grupo_id = gc.torre_id, torre_id = NULL
FROM torres t
WHERE gc.torre_id = t.id AND t.galeria_independiente = true;

-- Delete gallery-only torres that have no other references
DELETE FROM torres t
WHERE t.galeria_independiente = true
AND NOT EXISTS (SELECT 1 FROM unidades u WHERE u.torre_id = t.id)
AND NOT EXISTS (SELECT 1 FROM fachadas f WHERE f.torre_id = t.id)
AND NOT EXISTS (SELECT 1 FROM plano_puntos pp WHERE pp.torre_id = t.id)
AND NOT EXISTS (
  SELECT 1 FROM tipologias tip WHERE t.id = ANY(tip.torre_ids)
);
