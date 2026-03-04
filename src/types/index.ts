export interface Proyecto {
  id: string;
  user_id: string;
  slug: string;
  nombre: string;
  descripcion: string | null;
  logo_url: string | null;
  constructora_nombre: string | null;
  color_primario: string;
  color_secundario: string;
  color_fondo: string;
  estado: "borrador" | "publicado" | "archivado";
  disclaimer: string;
  whatsapp_numero: string | null;
  ubicacion_direccion: string | null;
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
  tour_360_url: string | null;
  brochure_url: string | null;
  render_principal_url: string | null;
  created_at: string;
  updated_at: string;
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

export interface ProyectoCompleto extends Proyecto {
  tipologias: Tipologia[];
  galeria_categorias: GaleriaCategoria[];
  videos: Video[];
  puntos_interes: PuntoInteres[];
}
