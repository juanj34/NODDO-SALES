-- Auto-bump proyectos.updated_at when any child table changes
-- This powers the "Cambios sin publicar" indicator in the editor

-- =====================================================
-- 1. Generic trigger for tables with proyecto_id
-- =====================================================
CREATE OR REPLACE FUNCTION bump_proyecto_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proyectos SET updated_at = now()
  WHERE id = COALESCE(NEW.proyecto_id, OLD.proyecto_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Trigger for galeria_imagenes (indirect via categoria_id)
-- =====================================================
CREATE OR REPLACE FUNCTION bump_proyecto_from_imagen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE proyectos SET updated_at = now()
  WHERE id = (
    SELECT proyecto_id FROM galeria_categorias
    WHERE id = COALESCE(NEW.categoria_id, OLD.categoria_id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Apply triggers to all child tables
-- =====================================================
CREATE TRIGGER trg_tipologias_bump
  AFTER INSERT OR UPDATE OR DELETE ON tipologias
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_galeria_categorias_bump
  AFTER INSERT OR UPDATE OR DELETE ON galeria_categorias
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_videos_bump
  AFTER INSERT OR UPDATE OR DELETE ON videos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_puntos_interes_bump
  AFTER INSERT OR UPDATE OR DELETE ON puntos_interes
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_unidades_bump
  AFTER INSERT OR UPDATE OR DELETE ON unidades
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_recursos_bump
  AFTER INSERT OR UPDATE OR DELETE ON recursos
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_fachadas_bump
  AFTER INSERT OR UPDATE OR DELETE ON fachadas
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_updated_at();

CREATE TRIGGER trg_galeria_imagenes_bump
  AFTER INSERT OR UPDATE OR DELETE ON galeria_imagenes
  FOR EACH ROW EXECUTE FUNCTION bump_proyecto_from_imagen();

-- =====================================================
-- 4. Public read policy for proyecto_versiones
--    (so public site can fetch published snapshots)
-- =====================================================
CREATE POLICY "Public read published versions"
  ON proyecto_versiones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM proyectos
    WHERE id = proyecto_id AND estado = 'publicado'
  ));
