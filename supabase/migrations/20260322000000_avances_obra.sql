-- Avances de Obra (Construction Progress Updates)
CREATE TABLE avances_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  fecha DATE NOT NULL,
  descripcion TEXT,
  video_url TEXT,
  imagen_url TEXT,
  orden INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE avances_obra ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access avances_obra"
  ON avances_obra FOR ALL
  USING (EXISTS (
    SELECT 1 FROM proyectos WHERE id = proyecto_id AND is_project_authorized(user_id)
  ));

CREATE POLICY "Public read avances_obra"
  ON avances_obra FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos WHERE id = proyecto_id AND estado = 'publicado'
  ));

-- Trigger to bump proyecto.updated_at
CREATE TRIGGER trg_avances_obra_bump
  AFTER INSERT OR UPDATE OR DELETE ON avances_obra
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();
