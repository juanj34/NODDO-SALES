-- ============================================================
-- Migration: Performance Indexes
-- Adds critical indexes for frequently filtered columns
-- Based on Supabase/Postgres best practices audit
-- SAFE: Adding indexes never breaks existing queries
-- ============================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Proyectos table indexes
-- ══════════════════════════════════════════════════════════════════════════════

-- Most API routes filter by user_id
CREATE INDEX IF NOT EXISTS idx_proyectos_user_id
  ON proyectos(user_id);

-- Slug lookups for microsite routing
CREATE INDEX IF NOT EXISTS idx_proyectos_slug
  ON proyectos(slug) WHERE estado = 'publicado';

-- Estado filtering
CREATE INDEX IF NOT EXISTS idx_proyectos_estado
  ON proyectos(estado);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Child tables: proyecto_id foreign keys
-- ══════════════════════════════════════════════════════════════════════════════

-- Tipologías
CREATE INDEX IF NOT EXISTS idx_tipologias_proyecto_id
  ON tipologias(proyecto_id);

-- Galería categorías
CREATE INDEX IF NOT EXISTS idx_galeria_categorias_proyecto_id
  ON galeria_categorias(proyecto_id);

-- Galería imágenes (categoria_id already used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_galeria_imagenes_categoria_id
  ON galeria_imagenes(categoria_id);

-- Videos
CREATE INDEX IF NOT EXISTS idx_videos_proyecto_id
  ON videos(proyecto_id);

-- Puntos de interés
CREATE INDEX IF NOT EXISTS idx_puntos_interes_proyecto_id
  ON puntos_interes(proyecto_id);

-- Recursos
CREATE INDEX IF NOT EXISTS idx_recursos_proyecto_id
  ON recursos(proyecto_id);

-- Fachadas
CREATE INDEX IF NOT EXISTS idx_fachadas_proyecto_id
  ON fachadas(proyecto_id);

-- Torres
CREATE INDEX IF NOT EXISTS idx_torres_proyecto_id
  ON torres(proyecto_id);

-- Planos interactivos
CREATE INDEX IF NOT EXISTS idx_planos_interactivos_proyecto_id
  ON planos_interactivos(proyecto_id);

-- Plano puntos
CREATE INDEX IF NOT EXISTS idx_plano_puntos_plano_id
  ON plano_puntos(plano_id);

-- Avances de obra
CREATE INDEX IF NOT EXISTS idx_avances_obra_proyecto_id
  ON avances_obra(proyecto_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. Unidades table (critical for availability/sales features)
-- ══════════════════════════════════════════════════════════════════════════════

-- Proyecto filtering
CREATE INDEX IF NOT EXISTS idx_unidades_proyecto_id
  ON unidades(proyecto_id);

-- Estado filtering (disponible/vendida/reservada)
CREATE INDEX IF NOT EXISTS idx_unidades_estado
  ON unidades(estado);

-- Composite for efficient availability queries
CREATE INDEX IF NOT EXISTS idx_unidades_proyecto_estado
  ON unidades(proyecto_id, estado);

-- Tipología filtering
CREATE INDEX IF NOT EXISTS idx_unidades_tipologia_id
  ON unidades(tipologia_id);

-- Torre filtering (for multi-tower projects)
CREATE INDEX IF NOT EXISTS idx_unidades_torre_id
  ON unidades(torre_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Leads table (CRM queries)
-- ══════════════════════════════════════════════════════════════════════════════

-- Proyecto filtering (verify it exists from init.sql, add if missing)
CREATE INDEX IF NOT EXISTS idx_leads_proyecto_id
  ON leads(proyecto_id);

-- Status filtering (nuevo/contactado/calificado/cerrado)
CREATE INDEX IF NOT EXISTS idx_leads_status
  ON leads(status);

-- Composite for filtered queries
CREATE INDEX IF NOT EXISTS idx_leads_proyecto_status
  ON leads(proyecto_id, status);

-- Email lookup for cotizaciones join
CREATE INDEX IF NOT EXISTS idx_leads_email
  ON leads(email);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. Colaboradores table
-- ══════════════════════════════════════════════════════════════════════════════

-- Admin user lookup (used in auth-context)
CREATE INDEX IF NOT EXISTS idx_colaboradores_admin_user_id
  ON colaboradores(admin_user_id);

-- Colaborador user lookup (used in auth-context)
CREATE INDEX IF NOT EXISTS idx_colaboradores_colaborador_user_id
  ON colaboradores(colaborador_user_id);

-- Estado filtering
CREATE INDEX IF NOT EXISTS idx_colaboradores_estado
  ON colaboradores(estado);

-- Email lookup for pending invitations
CREATE INDEX IF NOT EXISTS idx_colaboradores_email
  ON colaboradores(email) WHERE estado = 'pendiente';

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. Analytics indexes (already partially covered in analytics migration)
-- ══════════════════════════════════════════════════════════════════════════════

-- Composite for time-series queries (may already exist, add if missing)
CREATE INDEX IF NOT EXISTS idx_analytics_time_series
  ON analytics_events(proyecto_id, event_type, created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. Platform admin table
-- ══════════════════════════════════════════════════════════════════════════════

-- User lookup (used in middleware for admin access check)
CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id
  ON platform_admins(user_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. Versiones table
-- ══════════════════════════════════════════════════════════════════════════════

-- Proyecto lookup for version history
CREATE INDEX IF NOT EXISTS idx_proyecto_versiones_proyecto_id
  ON proyecto_versiones(proyecto_id);

-- Version number ordering
CREATE INDEX IF NOT EXISTS idx_proyecto_versiones_version_number
  ON proyecto_versiones(proyecto_id, version_number DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- 9. Domain mapping table
-- ══════════════════════════════════════════════════════════════════════════════

-- Custom domain lookup (used in middleware for domain resolution)
CREATE INDEX IF NOT EXISTS idx_proyectos_custom_domain
  ON proyectos(custom_domain) WHERE custom_domain IS NOT NULL;

-- Subdomain lookup
CREATE INDEX IF NOT EXISTS idx_proyectos_subdomain
  ON proyectos(subdomain) WHERE subdomain IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- 10. State history table (for analytics)
-- ══════════════════════════════════════════════════════════════════════════════

-- Unidad lookup for history
CREATE INDEX IF NOT EXISTS idx_unidad_state_history_unidad_id
  ON unidad_state_history(unidad_id);

-- Proyecto filtering for financial analytics
CREATE INDEX IF NOT EXISTS idx_unidad_state_history_proyecto_id
  ON unidad_state_history(proyecto_id);

-- Date range queries for sales analytics
CREATE INDEX IF NOT EXISTS idx_unidad_state_history_created_at
  ON unidad_state_history(created_at);

-- Composite for efficient financial queries
CREATE INDEX IF NOT EXISTS idx_unidad_state_history_proyecto_date
  ON unidad_state_history(proyecto_id, estado_nuevo, created_at DESC);

COMMENT ON INDEX idx_unidades_proyecto_estado IS 'Composite index for efficient availability filtering';
COMMENT ON INDEX idx_leads_proyecto_status IS 'Composite index for CRM dashboard queries';
COMMENT ON INDEX idx_unidad_state_history_proyecto_date IS 'Composite index for financial analytics RPCs';
