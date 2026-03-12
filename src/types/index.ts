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
  created_at: string;
  updated_at: string;
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
  created_at: string;
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
  torre_id: string | null;
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
