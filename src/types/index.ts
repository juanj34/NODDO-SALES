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

/* ── Custom Inventory Columns ────────────────────────────────────────── */

export interface CustomColumnDef {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
  show_in_editor: boolean;
  show_in_microsite: boolean;
  orden: number;
}

/* ── Inventory Column Visibility ──────────────────────────────────────── */

export type TipoTipologia = "apartamento" | "casa" | "lote" | "local_comercial";

export interface InventoryColumnConfig {
  area_m2: boolean;
  area_construida: boolean;
  area_privada: boolean;
  area_lote: boolean;
  habitaciones: boolean;
  banos: boolean;
  parqueaderos: boolean;
  depositos: boolean;
  orientacion: boolean;
  vista: boolean;
  precio: boolean;
  piso: boolean;
  lote: boolean;
  etapa: boolean;
}

/** Per-type column configs for hybrid projects */
export type InventoryColumnsByType = Partial<Record<TipoTipologia, InventoryColumnConfig>>;

/* ── Projects ────────────────────────────────────────────────────────────── */

export interface Proyecto {
  id: string;
  user_id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  logo_height: number | null;
  constructora_nombre: string | null;
  constructora_logo_url: string | null;
  constructora_website: string | null;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  tema_modo: "oscuro" | "claro";
  estado: "borrador" | "publicado" | "archivado";
  plan: "basico" | "pro";
  tipo_proyecto: "apartamentos" | "casas" | "hibrido" | "lotes";
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
  unidad_display_prefix: string | null;
  background_audio_url: string | null;
  hide_noddo_badge: boolean;
  ocultar_vendidas: boolean;
  ocultar_precio_vendidas: boolean;
  habilitar_extra_jacuzzi: boolean;
  habilitar_extra_piscina: boolean;
  habilitar_extra_bbq: boolean;
  habilitar_extra_terraza: boolean;
  habilitar_extra_jardin: boolean;
  habilitar_extra_cuarto_servicio: boolean;
  habilitar_extra_estudio: boolean;
  habilitar_extra_chimenea: boolean;
  habilitar_extra_doble_altura: boolean;
  habilitar_extra_rooftop: boolean;
  idioma: "es" | "en";
  moneda_base: Currency;
  unidad_medida_base: UnitOfMeasurement;
  cotizador_enabled: boolean;
  parqueaderos_mode: ComplementoMode;
  depositos_mode: ComplementoMode;
  parqueaderos_precio_base: number | null;
  depositos_precio_base: number | null;
  tipologia_mode: "fija" | "multiple";
  precio_source: "unidad" | "tipologia";
  cotizador_config: CotizadorConfig | null;
  email_config: EmailConfig | null;
  webhook_config: WebhookConfig | null;
  inventory_columns: InventoryColumnConfig | null;
  inventory_columns_by_type: InventoryColumnsByType | null;
  inventory_columns_microsite: InventoryColumnConfig | null;
  inventory_columns_microsite_by_type: InventoryColumnsByType | null;
  custom_columns: CustomColumnDef[];
  secciones_visibles: SeccionesVisibles | null;
  tipologia_fields: TipologiaFieldsConfig | null;
  agent_mode_config: AgentModeConfig | null;
  disponibilidad_config: DisponibilidadConfig | null;
  estado_construccion: "sobre_planos" | "en_construccion" | "entregado";
  politica_amoblado: "incluido" | "opcional" | "no";
  precio_amoblado: number | null;
  created_at: string;
  updated_at: string;
}

/* ── Tipología Field Visibility ────────────────────────────────── */

/** Controls which spec fields are visible in tipología editor form,
 *  microsite detail panels, and cotizador. Separate from inventory_columns
 *  which controls unit LIST views. */
export interface TipologiaFieldsConfig {
  area_m2: boolean;
  area_construida: boolean;
  area_privada: boolean;
  area_lote: boolean;
  area_balcon: boolean;
  habitaciones: boolean;
  banos: boolean;
  parqueaderos: boolean;
  depositos: boolean;
  precio: boolean;
}

/* ── Section Visibility ──────────────────────────────────────────── */

/* ── Agent Mode Config ──────────────────────────────────────────── */

export interface AgentModeConfig {
  enabled: boolean;
  mostrar_precios: boolean;
  mostrar_vendidas: boolean;
  mostrar_precio_vendidas: boolean;
  mostrar_todas_secciones: boolean;
  habilitar_cotizador: boolean;
}

export interface DisponibilidadConfig {
  require_lead_on_commit?: boolean;
  require_cotizacion_on_commit?: boolean;
}

export interface SeccionesVisibles {
  galeria: boolean;
  tipologias: boolean;
  inventario: boolean;
  explorar: boolean;
  implantaciones: boolean;
  ubicacion: boolean;
  videos: boolean;
  recursos: boolean;
  avances: boolean;
  tour360: boolean;
  contacto: boolean;
  plan_pago: boolean;
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
  renders?: string[];
}

export interface TipologiaPiso {
  id: string;
  nombre: string;
  plano_url: string;
  hotspots: TipologiaHotspot[];
  orden: number;
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
  area_construida: number | null;
  area_privada: number | null;
  area_lote: number | null;
  hotspots: TipologiaHotspot[];
  pisos: TipologiaPiso[] | null;
  ubicacion_plano_url: string | null;
  torre_ids: string[];
  tipo_tipologia: TipoTipologia | null;
  orden: number;
  created_at: string;
  precio_actualizado_en: string | null;
  precio_actualizado_por: string | null;
  video_id: string | null;
  tour_360_url: string | null;
  amenidades_data: AmenidadItem[] | null;
  tiene_jacuzzi: boolean;
  tiene_piscina: boolean;
  tiene_bbq: boolean;
  tiene_terraza: boolean;
  tiene_jardin: boolean;
  tiene_cuarto_servicio: boolean;
  tiene_estudio: boolean;
  tiene_chimenea: boolean;
  tiene_doble_altura: boolean;
  tiene_rooftop: boolean;
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
  asignado_a: string | null;
  created_at: string;
}

export interface LeadWithMeta extends Lead {
  cotizaciones_count: number;
  proyecto_nombre?: string;
  asignado_nombre?: string | null;
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
  tipo: "brochure" | "ficha_tecnica" | "acabados" | "precios" | "planos" | "render" | "manual" | "reglamento" | "garantias" | "otro";
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
  area_construida: number | null;
  area_privada: number | null;
  area_lote: number | null;
  precio: number | null;
  precio_venta: number | null;
  lead_id: string | null;
  cotizacion_id: string | null;
  estado: "disponible" | "separado" | "reservada" | "vendida" | "proximamente";
  habitaciones: number | null;
  banos: number | null;
  orientacion: string | null;
  orientacion_id: string | null;
  vista: string | null;
  vista_id: string | null;
  vista_piso_id: string | null;
  notas: string | null;
  plano_url: string | null;
  fachada_id: string | null;
  fachada_x: number | null;
  fachada_y: number | null;
  planta_id: string | null;
  planta_x: number | null;
  planta_y: number | null;
  torre_id: string | null;
  lote: string | null;
  etapa_nombre: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  custom_fields: Record<string, unknown>;
  orden: number;
  created_at: string;
}

export interface UnidadTipologia {
  id: string;
  proyecto_id: string;
  unidad_id: string;
  tipologia_id: string;
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

export interface Orientacion {
  id: string;
  proyecto_id: string;
  nombre: string;
  orden: number;
  created_at: string;
}

export interface Vista {
  id: string;
  proyecto_id: string;
  nombre: string;
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
  amenidades_data: AmenidadItem[] | null;
  created_at: string;
}

export interface PlanoPunto {
  id: string;
  plano_id: string;
  titulo: string;
  descripcion: string | null;
  imagen_url: string | null;
  render_url: string | null;
  renders?: string[];
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
  orientaciones: Orientacion[];
  vistas: Vista[];
  torres: Torre[];
  planos_interactivos: PlanoInteractivo[];
  plano_puntos: PlanoPunto[];
  avances_obra: AvanceObra[];
  complementos: Complemento[];
  vistas_piso: VistaPiso[];
  unidad_tipologias: UnidadTipologia[];
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
  area_construida: number | null;
  area_privada: number | null;
  area_lote: number | null;
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
  tema_modo: string | null;
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
  rol: "director" | "asesor";
  invited_at: string;
  activated_at: string | null;
  created_at: string;
  profile?: {
    nombre: string;
    apellido: string;
    telefono: string | null;
    avatar_url: string | null;
  } | null;
}

export type UserRole = "admin" | "director" | "asesor";

/* ── User Profiles ── */

export interface UserProfile {
  user_id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  avatar_url: string | null;
}

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

/* ── Financiero Response ── */

export interface FinancieroProjectBreakdown {
  id: string;
  nombre: string;
  currency: Currency;
  financial: FinancialMetrics;
}

export interface FinancieroResponse {
  total_revenue: number;
  total_available_value: number;
  total_reservada_value: number;
  avg_sales_velocity: number;
  total_units: number;
  total_disponible: number;
  total_proximamente: number;
  total_separado: number;
  total_reservada: number;
  total_vendida: number;
  sell_through_rate: number;
  projects: FinancieroProjectBreakdown[];
  monthly_revenue: MonthlyRevenue[];
  units_sold_detail: UnitSoldDetail[];
  primary_currency: Currency;
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
  fecha?: string;
  /** Milestone condition text (e.g. "Al 50% de avance constructivo") */
  condicion_hito?: string;
}

export interface DescuentoConfig {
  id: string;
  nombre: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
}

/** @deprecated Use CargoAdicional instead */
export interface ImpuestoConfig {
  id: string;
  nombre: string;
  porcentaje: number;
}

export interface CargoAdicional {
  id: string;
  nombre: string;
  tipo: "porcentaje" | "fijo";
  valor: number;
}

/* ── Construction Milestones ── */

export interface HitoConstructivo {
  id: string;
  nombre: string;
  nombre_en?: string;
  orden: number;
  fecha_estimada?: string;
}

/* ── Payment Plan Templates ── */

export interface ReglaFecha {
  tipo: "al_reservar" | "meses_desde_reserva" | "al_completar" | "al_avance";
  /** Only used when tipo === "meses_desde_reserva" */
  meses?: number;
  /** Only used when tipo === "al_avance" — e.g. 50 means "at 50% construction progress" */
  porcentaje_avance?: number;
}

export interface PlantillaPagoFila {
  id: string;
  nombre: string;
  tipo_valor: "porcentaje" | "fijo" | "resto";
  valor: number;
  regla_fecha: ReglaFecha;
}

export interface PlantillaPago {
  id: string;
  nombre: string;
  titulo?: string;
  filas: PlantillaPagoFila[];
  es_default?: boolean;
  created_at?: string;
  quick_def?: PlantillaQuickDef;
  // ── Per-plantilla config (overrides project-level CotizadorConfig) ──
  moneda?: string;
  separacion_incluida_en_inicial?: boolean;
  cargos_adicionales?: CargoAdicional[];
  /** @deprecated Use cargos_adicionales */
  impuestos?: ImpuestoConfig[];
  /** @deprecated Use cargos_adicionales */
  admin_fee?: number;
  /** @deprecated Use cargos_adicionales */
  admin_fee_label?: string;
  tipo_entrega?: "fecha_fija" | "plazo_desde_compra" | null;
  fecha_estimada_entrega?: string;
  plazo_entrega_meses?: number;
  notas_legales?: string | null;
  habilitada_micrositio?: boolean;
}

export interface PlantillaQuickDef {
  porcentaje_inicial: number;
  cuotas: number;
  frecuencia: "mensual" | "bimestral" | "trimestral";
  incluye_separacion: boolean;
  separacion_monto?: number;
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
  // PDF style options
  pdf_cover_style?: "hero" | "minimalista";
  pdf_theme?: "dark" | "neutral";
  // PDF-specific logos (dark versions for white PDF pages)
  pdf_logo_constructora_url?: string | null;
  pdf_logo_proyecto_url?: string | null;
  // Payment plan header
  payment_plan_nombre?: string;
  // Unified additional charges (taxes, fees — replaces admin_fee + impuestos)
  cargos_adicionales?: CargoAdicional[];
  /** @deprecated Use cargos_adicionales */
  admin_fee?: number;
  /** @deprecated Use cargos_adicionales */
  admin_fee_label?: string;
  // Delivery configuration
  /** Delivery model: fixed date (buildings) or term from purchase (houses/lots) */
  tipo_entrega?: "fecha_fija" | "plazo_desde_compra" | null;
  /** Months from purchase to delivery (for plazo_desde_compra). Default: 24 */
  plazo_entrega_meses?: number;
  // Microsite payment plan page
  /** Background image URL for the payment plan page (low opacity behind cards) */
  plan_pago_bg_url?: string;
  /** @deprecated Use cargos_adicionales */
  impuestos?: ImpuestoConfig[];
  // Reusable payment plan templates
  plantillas_pago?: PlantillaPago[];
  // Construction milestones for anchoring payment phases
  hitos_constructivos?: HitoConstructivo[];
}

/* -- Email Configuration -- */

export interface EmailConfig {
  reply_to: string | null;
  show_project_logo: boolean;
  show_constructora_logo: boolean;
  email_tema?: "oscuro" | "claro";
  email_project_logo_url?: string | null;
  email_constructora_logo_url?: string | null;
  saludo: string | null;
  cuerpo: string | null;
  despedida: string | null;
  adjuntar_cotizacion_pdf: boolean;
  adjuntar_brochure: boolean;
  adjuntos_recurso_ids: string[];
  boton_whatsapp: boolean;
  boton_tour_360: boolean;
  boton_brochure_link: boolean;
  boton_micrositio: boolean;
}

export interface FaseResultado {
  nombre: string;
  monto_total: number;
  cuotas: number;
  monto_por_cuota: number;
  frecuencia: string;
  fecha?: string;
  porcentaje?: number;
  /** Milestone condition text (e.g. "Al completar estructura") */
  condicion_hito?: string;
}

export interface ResultadoCotizacion {
  precio_base: number;
  descuentos_aplicados: { nombre: string; monto: number }[];
  precio_neto: number;
  fases: FaseResultado[];
  complementos?: ComplementoSeleccion[];
  complementos_total?: number;
  precio_total?: number;
  // Unified additional charges applied
  cargos_aplicados?: { nombre: string; monto: number; tipo: "porcentaje" | "fijo"; porcentaje?: number }[];
  cargos_total?: number;
  /** @deprecated Use cargos_aplicados */
  admin_fee?: number;
  /** @deprecated Use cargos_aplicados */
  admin_fee_label?: string;
  /** @deprecated Use cargos_aplicados */
  impuestos_aplicados?: { nombre: string; monto: number; porcentaje: number }[];
  /** @deprecated Use cargos_aplicados */
  impuestos_total?: number;
  /** Computed delivery date (ISO string) when tipo_entrega is configured */
  fecha_entrega_calculada?: string;
  /** Remaining months until delivery */
  meses_restantes?: number;
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
  | "features_updated"
  | "project_moderated"
  | "user_invited"
  | "project_plan_changed";

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

/* ── Complementos (Parking & Storage) ── */

export type ComplementoMode = "sin_inventario" | "inventario_incluido" | "inventario_separado" | "precio_base";

export interface Complemento {
  id: string;
  proyecto_id: string;
  torre_id: string | null;
  unidad_id: string | null;
  tipo: "parqueadero" | "deposito" | "addon";
  subtipo: string | null;
  identificador: string;
  nivel: string | null;
  area_m2: number | null;
  precio: number | null;
  estado: "disponible" | "separado" | "reservada" | "vendida" | "proximamente";
  notas: string | null;
  orden: number;
  created_at: string;
}

export interface ComplementoSeleccion {
  complemento_id: string;
  tipo: "parqueadero" | "deposito" | "addon";
  identificador: string;
  subtipo: string | null;
  precio: number | null;
  suma_al_total: boolean;
  /** precio_base mode: how many items at the base price */
  cantidad?: number;
  /** precio_base mode: virtual item, not a real complemento record */
  es_precio_base?: boolean;
  /** extras: distinguishes included vs extra complementos */
  es_extra?: boolean;
  /** extras: negotiated price override (for inventario_incluido extras) */
  precio_negociado?: number;
}

/* ── Vistas por Piso (Floor Views) ── */

export interface VistaPiso {
  id: string;
  proyecto_id: string;
  torre_id: string | null;
  nombre: string;
  descripcion: string | null;
  orientacion: string | null;
  piso_min: number | null;
  piso_max: number | null;
  tipologia_ids: string[];
  imagen_url: string;
  thumbnail_url: string | null;
  orden: number;
  created_at: string;
}

/* ── Activity Log (Bitácora) ── */

export type ActivityCategory =
  | "project"
  | "unit"
  | "tipologia"
  | "gallery"
  | "video"
  | "lead"
  | "cotizacion"
  | "colaborador"
  | "content"
  | "other";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  user_role: "admin" | "director" | "asesor";
  proyecto_id: string | null;
  proyecto_nombre: string | null;
  action_type: string;
  action_category: ActivityCategory;
  description: string;
  description_en: string | null;
  metadata: Record<string, unknown>;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

/* ── Plans & Billing ── */

/* ── Cotizador Tool ── */

export interface ProjectForCotizador {
  id: string;
  nombre: string;
  cotizador_enabled: boolean;
  cotizador_config: CotizadorConfig | null;
  color_primario: string | null;
  parqueaderos_mode: ComplementoMode;
  depositos_mode: ComplementoMode;
  parqueaderos_precio_base: number | null;
  depositos_precio_base: number | null;
  precio_source: "unidad" | "tipologia";
  tipologia_mode: "fija" | "multiple";
  tipologia_fields?: TipologiaFieldsConfig | null;
  habilitar_extra_jacuzzi?: boolean;
  habilitar_extra_piscina?: boolean;
  habilitar_extra_bbq?: boolean;
  habilitar_extra_terraza?: boolean;
  habilitar_extra_jardin?: boolean;
  habilitar_extra_cuarto_servicio?: boolean;
  habilitar_extra_estudio?: boolean;
  habilitar_extra_chimenea?: boolean;
  habilitar_extra_doble_altura?: boolean;
  habilitar_extra_rooftop?: boolean;
  politica_amoblado?: "incluido" | "opcional" | "no";
  precio_amoblado?: number | null;
  idioma?: string | null;
}

export type Plan = "basico" | "pro" | "enterprise";

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

/* ── Constructora Portal ─────────────────────────────────────────────── */

export interface ConstructoraPortal {
  id: string;
  user_id: string;
  nombre: string;
  slug: string;
  logo_url: string | null;
  descripcion: string | null;
  color_primario: string;
  layout: "slider" | "grid";
  custom_domain: string | null;
  domain_verified: boolean;
  proyecto_ids: string[] | null;
  hero_video_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
