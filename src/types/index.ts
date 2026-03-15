/* ── Currency & Units ────────────────────────────────────────────────────── */

export type Currency = "COP" | "USD" | "AED" | "MXN" | "EUR";

export type UnitOfMeasurement = "m2" | "sqft";

export interface ExchangeRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
  source: string;
  created_at: string;
}

export interface CurrencyConversionResult {
  amount: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  timestamp: string;
}

export interface AreaConversionResult {
  value: number;
  fromUnit: UnitOfMeasurement;
  toUnit: UnitOfMeasurement;
  conversionFactor: number;
}

/* ── Projects ────────────────────────────────────────────────────────────── */

export interface Proyecto {
  id: string;
  user_id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  constructora_nombre: string | null;
  constructora_logo_url: string | null;
  constructora_website: string | null;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  estado: "borrador" | "publicado" | "archivado";
  tipo_proyecto: "apartamentos" | "casas" | "hibrido";
  disclaimer: string;
  politica_privacidad_url: string | null;
  whatsapp_numero: string | null;
  ubicacion_direccion: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  tour_360_url: string | null;
  brochure_url: string | null;
  render_principal_url: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
  hero_video_url: string | null;
  fachada_url: string | null;
  mapa_ubicacion_url: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  domain_verified: boolean;
  etapa_label: string;
  background_audio_url: string | null;
  hide_noddo_badge: boolean;
  moneda_base: Currency;
  unidad_medida_base: UnitOfMeasurement;
  cotizador_enabled: boolean;
  cotizador_config: CotizadorConfig | null;
  webhook_config: WebhookConfig | null;
  created_at: string;
  updated_at: string;
}

export interface ProyectoStats {
  unidades_total?: number;
  leads_7d?: number;
  views_7d?: number;
  visitors_7d?: number;
  interactions_7d?: number;
  conversion_rate?: number;
  sparkline?: { bucket: string; views: number }[];
}

export interface ProyectoWithStats extends Proyecto {
  stats?: ProyectoStats;
}

export interface TipologiaHotspot {
  id: string;
  label: string;
  x: number;
  y: number;
  render_url: string;
}

export interface Tipologia {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion: string | null;
  area_m2: number | null;
  habitaciones: number | null;
  banos: number | null;
  precio_desde: number | null;
  plano_url: string | null;
  renders: string[];
  caracteristicas: string[];
  parqueaderos: number | null;
  depositos: number | null;
  area_balcon: number | null;
  hotspots: TipologiaHotspot[];
  ubicacion_plano_url: string | null;
  torre_ids: string[];
  orden: number;
  created_at: string;
}

export interface GaleriaCategoria {
  id: string;
  proyecto_id: string;
  nombre: string;
  slug: string;
  orden: number;
  torre_id: string | null;
  imagenes?: GaleriaImagen[];
}

export interface GaleriaImagen {
  id: string;
  categoria_id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  orden: number;
}

/** Generic image for Lightbox — GaleriaImagen satisfies this interface */
export interface LightboxImage {
  id: string;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  label?: string;
}

export interface Video {
  id: string;
  proyecto_id: string;
  titulo: string | null;
  url: string;
  thumbnail_url: string | null;
  orden: number;
  stream_uid: string | null;
  stream_status: string | null;
  duration: number | null;
  size_bytes: number | null;
}

export interface Lead {
  id: string;
  proyecto_id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  pais: string | null;
  tipologia_interes: string | null;
  mensaje: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: "nuevo" | "contactado" | "calificado" | "cerrado";
  created_at: string;
}

export interface LeadWithMeta extends Lead {
  cotizaciones_count: number;
  proyecto_nombre?: string;
}

export interface LeadCotizacionSummary {
  id: string;
  unidad_snapshot: Record<string, unknown>;
  resultado: ResultadoCotizacion;
  pdf_url: string | null;
  agente_nombre: string | null;
  created_at: string;
}

export interface LeadStats {
  total_all: number;
  this_month: number;
  with_cotizaciones: number;
  by_status: Record<string, number>;
}

export interface PuntoInteres {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  imagen_url: string | null;
  ciudad: string | null;
  lat: number;
  lng: number;
  distancia_km: number | null;
  tiempo_minutos: number | null;
  orden: number;
}

export interface Recurso {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion: string | null;
  tipo: "brochure" | "ficha_tecnica" | "acabados" | "precios" | "otro";
  url: string;
  orden: number;
}

export interface Unidad {
  id: string;
  proyecto_id: string;
  tipologia_id: string | null;
  identificador: string;
  piso: number | null;
  area_m2: number | null;
  precio: number | null;
  estado: "disponible" | "separado" | "reservada" | "vendida";
  habitaciones: number | null;
  banos: number | null;
  orientacion: string | null;
  vista: string | null;
  notas: string | null;
  fachada_id: string | null;
  fachada_x: number | null;
  fachada_y: number | null;
  planta_id: string | null;
  planta_x: number | null;
  planta_y: number | null;
  torre_id: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  orden: number;
  created_at: string;
}

export interface Fachada {
  id: string;
  proyecto_id: string;
  nombre: string;
  imagen_url: string;
  num_pisos: number | null;
  descripcion: string | null;
  amenidades: string | null;
  imagen_portada: string | null;
  torre_id: string | null;
  tipo: "fachada" | "planta";
  piso_numero: number | null;
  planta_tipo_nombre: string | null;
  puntos_vacios: { x: number; y: number }[];
  orden: number;
  created_at: string;
}

export interface Torre {
  id: string;
  proyecto_id: string;
  nombre: string;
  tipo: "torre" | "urbanismo";
  num_pisos: number | null;
  pisos_sotano: number | null;
  pisos_planta_baja: number | null;
  pisos_podio: number | null;
  pisos_residenciales: number | null;
  pisos_rooftop: number | null;
  descripcion: string | null;
  amenidades: string | null;
  amenidades_data: AmenidadItem[] | null;
  caracteristicas: string | null;
  imagen_portada: string | null;
  logo_url: string | null;
  prefijo: string | null;
  orden: number;
  created_at: string;
}

export interface AmenidadItem {
  id: string;
  nombre: string;
  icono: string;
  icon_url?: string;
}

export interface PlanoInteractivo {
  id: string;
  proyecto_id: string;
  nombre: string;
  descripcion: string | null;
  imagen_url: string;
  tipo: "implantacion" | "urbanismo";
  visible: boolean;
  orden: number;
  created_at: string;
}

export interface PlanoPunto {
  id: string;
  plano_id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  render_url: string | null;
  fachada_id: string | null;
  torre_id: string | null;
  x: number;
  y: number;
  orden: number;
  created_at: string;
}

export interface ProyectoCompleto extends Proyecto {
  tipologias: Tipologia[];
  galeria_categorias: GaleriaCategoria[];
  videos: Video[];
  puntos_interes: PuntoInteres[];
  unidades: Unidad[];
  recursos: Recurso[];
  fachadas: Fachada[];
  torres: Torre[];
  planos_interactivos: PlanoInteractivo[];
  plano_puntos: PlanoPunto[];
  avances_obra: AvanceObra[];
}

export interface AvanceObra {
  id: string;
  proyecto_id: string;
  titulo: string;
  fecha: string;
  descripcion: string | null;
  video_url: string | null;
  imagen_url: string | null;
  estado: "borrador" | "publicado";
  orden: number;
  created_at: string;
}

export interface ProyectoVersion {
  id: string;
  proyecto_id: string;
  version_number: number;
  published_at: string;
  published_by: string | null;
}

export interface AITipologiaData {
  nombre: string;
  descripcion: string | null;
  area_m2: number | null;
  habitaciones: number | null;
  banos: number | null;
  precio_desde: number | null;
  caracteristicas: string[];
  parqueaderos: number | null;
  depositos: number | null;
  area_balcon: number | null;
}

export interface AIProjectData {
  nombre: string | null;
  descripcion: string | null;
  constructora_nombre: string | null;
  ubicacion_direccion: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  color_primario: string | null;
  color_secundario: string | null;
  color_fondo: string | null;
  whatsapp_numero: string | null;
  disclaimer: string | null;
  tipologias: AITipologiaData[];
}

export interface Colaborador {
  id: string;
  admin_user_id: string;
  colaborador_user_id: string | null;
  email: string;
  nombre: string | null;
  estado: "pendiente" | "activo" | "suspendido";
  invited_at: string;
  activated_at: string | null;
  created_at: string;
}

export type UserRole = "admin" | "colaborador";

/* ── Analytics ── */

export interface AnalyticsEvent {
  id: string;
  proyecto_id: string;
  event_type: string;
  page_path: string | null;
  session_id: string;
  visitor_id: string | null;
  device_type: "desktop" | "mobile" | "tablet" | null;
  user_agent: string | null;
  screen_width: number | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  country: string | null;
  city: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnalyticsSummary {
  total_views: number;
  unique_visitors: number;
  total_sessions: number;
  avg_session_duration: number;
  bounce_rate: number;
  whatsapp_clicks: number;
  brochure_downloads: number;
  video_plays: number;
  recurso_downloads: number;
  cta_clicks: number;
}

export interface AnalyticsTimeSeries {
  bucket: string;
  views: number;
  visitors: number;
}

export interface AnalyticsBreakdown {
  label: string;
  count: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  total_leads: number;
  conversion_rate: number;
  bounce_rate: number;
  avg_pages_per_session: number;
  views_over_time: AnalyticsTimeSeries[];
  leads_over_time: AnalyticsBreakdown[];
  views_by_page: AnalyticsBreakdown[];
  views_by_device: AnalyticsBreakdown[];
  views_by_country: AnalyticsBreakdown[];
  views_by_referrer: AnalyticsBreakdown[];
  leads_by_source: AnalyticsBreakdown[];
  leads_by_tipologia: AnalyticsBreakdown[];
  leads_by_country: AnalyticsBreakdown[];
  financial?: FinancialMetrics;
}

/* ── Financial Analytics ── */

export interface FinancialMetrics {
  total_revenue: number;
  available_inventory_value: number;
  reservada_inventory_value: number;
  sales_velocity: number; // unidades/mes
  monthly_revenue: MonthlyRevenue[];
  units_sold_detail: UnitSoldDetail[];
  currency: Currency;
  total_units: number;
  disponible_count: number;
  vendida_count: number;
  reservada_count: number;
}

export interface MonthlyRevenue {
  month: string; // YYYY-MM
  revenue: number;
  count: number;
}

export interface UnitSoldDetail {
  unidad_id: string;
  identificador: string;
  tipologia: string | null;
  precio: number;
  area_m2: number | null;
  sold_at: string;
  month: string; // YYYY-MM
}

export interface EmailReportConfig {
  id?: string;
  user_id?: string;
  weekly_enabled: boolean;
  monthly_enabled: boolean;
  project_ids: string[] | null;
  email_override: string | null;
  timezone: string;
  last_weekly_sent: string | null;
  last_monthly_sent: string | null;
}

/* ── Dashboard Home ── */

export interface DashboardSummary {
  total_views: number;
  unique_visitors: number;
  total_leads: number;
  conversion_rate: number;
  total_interactions: number;
  views_sparkline: { bucket: string; views: number }[];
  recent_leads: DashboardRecentLead[];
  project_stats: Record<string, {
    views_7d: number;
    leads_7d: number;
    visitors_7d: number;
    interactions_7d: number;
    conversion_rate: number;
    sparkline: { bucket: string; views: number }[];
  }>;
}

export interface DashboardRecentLead {
  id: string;
  nombre: string;
  email: string;
  pais: string | null;
  tipologia_interes: string | null;
  proyecto_nombre: string;
  proyecto_id: string;
  created_at: string;
}

/* ── Cotizador ── */

export interface FaseConfig {
  id: string;
  nombre: string;
  tipo: "fijo" | "porcentaje" | "resto";
  valor: number;
  cuotas: number;
  frecuencia: "unica" | "mensual" | "bimestral" | "trimestral";
}

export interface DescuentoConfig {
  id: string;
  nombre: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
}

export interface CotizadorConfig {
  moneda: string;
  fases: FaseConfig[];
  descuentos: DescuentoConfig[];
  separacion_incluida_en_inicial: boolean;
  notas_legales: string | null;
  // PDF customization (optional, backward compatible)
  pdf_saludo?: string;
  pdf_despedida?: string;
  fecha_estimada_entrega?: string;
  portada_url?: string;
}

export interface FaseResultado {
  nombre: string;
  monto_total: number;
  cuotas: number;
  monto_por_cuota: number;
  frecuencia: string;
}

export interface ResultadoCotizacion {
  precio_base: number;
  descuentos_aplicados: { nombre: string; monto: number }[];
  precio_neto: number;
  fases: FaseResultado[];
}

export interface Cotizacion {
  id: string;
  proyecto_id: string;
  unidad_id: string | null;
  nombre: string;
  email: string;
  telefono: string | null;
  unidad_snapshot: Record<string, unknown>;
  config_snapshot: CotizadorConfig;
  resultado: ResultadoCotizacion;
  pdf_url: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  agente_id: string | null;
  agente_nombre: string | null;
  created_at: string;
}

/* ── Platform Admin ── */

export type AuditAction =
  | "user_banned"
  | "user_unbanned"
  | "user_deleted"
  | "plan_changed"
  | "project_archived"
  | "project_deleted"
  | "admin_added"
  | "admin_removed"
  | "features_updated";

export type AuditTargetType = "user" | "project" | "admin";

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: AuditAction;
  target_type: AuditTargetType;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  email: string;
  nombre: string | null;
  created_at: string;
}

export interface PlatformFunnel {
  signed_up: number;
  project_created: number;
  content_added: number;
  published: number;
  first_lead: number;
}

export interface PlatformStorage {
  total_bytes: number;
  tours_bytes: number;
  videos_bytes: number;
  media_bytes: number;
  total_limit_bytes: number;
}

export interface GrowthBucket {
  bucket: string;
  count: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalProjects: number;
  publishedProjects: number;
  totalLeads: number;
  leadsInRange: number;
  recentSignups: number;
  planDistribution: Record<string, number>;
  usersTrend: number | null;
  projectsTrend: number | null;
  leadsTrend: number | null;
  viewsTrend: number | null;
  usersOverTime: GrowthBucket[];
  projectsOverTime: GrowthBucket[];
  leadsOverTime: AnalyticsBreakdown[];
  viewsOverTime: AnalyticsTimeSeries[];
  platformSummary: AnalyticsSummary;
  topProjectsByViews: { id: string; nombre: string; slug: string; views: number }[];
  topProjectsByLeads: { id: string; nombre: string; slug: string; leads: number }[];
  viewsByCountry: AnalyticsBreakdown[];
  viewsByDevice: AnalyticsBreakdown[];
  funnel: PlatformFunnel;
  storage: PlatformStorage;
}

/* ── Webhooks ── */

export type WebhookEventType = "lead.created" | "cotizacion.created";

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  secret: string;
  events: WebhookEventType[];
}

export interface WebhookLog {
  id: string;
  proyecto_id: string;
  event_type: WebhookEventType;
  url: string;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  error: string | null;
  delivered: boolean;
  created_at: string;
}

export interface PlatformAlert {
  id: string;
  type: "new_signups" | "storage_warning" | "lead_spike" | "trial_expired";
  severity: "info" | "warning" | "critical";
  message: string;
  details: Record<string, unknown>;
  created_at: string;
}

/* ── Plans & Billing ── */

export type Plan = "basic" | "premium" | "enterprise";

export interface UserPlan {
  id: string;
  user_id: string;
  plan: Plan;
  status: "active" | "trial" | "cancelled" | "suspended";
  max_projects: number;
  max_units_per_project: number | null;
  max_collaborators: number;
  started_at: string;
  expires_at: string | null;
  notes: string | null;
  created_at: string;
}
