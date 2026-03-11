import { createClient } from "./client";
import type {
  Proyecto,
  ProyectoCompleto,
  Tipologia,
  GaleriaCategoria,
  GaleriaImagen,
  Video,
  Lead,
  PuntoInteres,
  Recurso,
} from "@/types";

const supabase = createClient();

// ==================== PROYECTOS ====================

export async function getProyectosByUser(): Promise<Proyecto[]> {
  const { data, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProyectoById(id: string): Promise<ProyectoCompleto | null> {
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !proyecto) return null;

  const [tipologias, categorias, videos, puntos_interes, recursos] = await Promise.all([
    getTipologiasByProyecto(id),
    getCategoriasByProyecto(id),
    getVideosByProyecto(id),
    getPuntosInteresByProyecto(id),
    getRecursosByProyecto(id),
  ]);

  return { ...proyecto, tipologias, galeria_categorias: categorias, videos, puntos_interes, recursos };
}

export async function getProyectoBySlug(slug: string): Promise<ProyectoCompleto | null> {
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();

  if (error || !proyecto) return null;

  const [tipologias, categorias, videos, puntos_interes, recursos] = await Promise.all([
    getTipologiasByProyecto(proyecto.id),
    getCategoriasByProyecto(proyecto.id),
    getVideosByProyecto(proyecto.id),
    getPuntosInteresByProyecto(proyecto.id),
    getRecursosByProyecto(proyecto.id),
  ]);

  return { ...proyecto, tipologias, galeria_categorias: categorias, videos, puntos_interes, recursos };
}

export async function createProyecto(
  data: Partial<Proyecto> & { nombre: string; slug: string; user_id: string }
): Promise<Proyecto> {
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return proyecto;
}

export async function updateProyecto(
  id: string,
  data: Partial<Proyecto>
): Promise<Proyecto> {
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return proyecto;
}

export async function deleteProyecto(id: string): Promise<void> {
  const { error } = await supabase.from("proyectos").delete().eq("id", id);
  if (error) throw error;
}

// ==================== TIPOLOGIAS ====================

export async function getTipologiasByProyecto(proyectoId: string): Promise<Tipologia[]> {
  const { data, error } = await supabase
    .from("tipologias")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}

export async function createTipologia(
  data: Partial<Tipologia> & { proyecto_id: string; nombre: string }
): Promise<Tipologia> {
  const { data: tipo, error } = await supabase
    .from("tipologias")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return tipo;
}

export async function updateTipologia(
  id: string,
  data: Partial<Tipologia>
): Promise<Tipologia> {
  const { data: tipo, error } = await supabase
    .from("tipologias")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return tipo;
}

export async function deleteTipologia(id: string): Promise<void> {
  const { error } = await supabase.from("tipologias").delete().eq("id", id);
  if (error) throw error;
}

// ==================== GALERIA ====================

export async function getCategoriasByProyecto(
  proyectoId: string
): Promise<GaleriaCategoria[]> {
  const { data: categorias, error } = await supabase
    .from("galeria_categorias")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  if (!categorias) return [];

  const categoriasConImagenes = await Promise.all(
    categorias.map(async (cat) => {
      const { data: imagenes } = await supabase
        .from("galeria_imagenes")
        .select("*")
        .eq("categoria_id", cat.id)
        .order("orden");

      return { ...cat, imagenes: imagenes || [] };
    })
  );

  return categoriasConImagenes;
}

export async function createCategoria(
  data: Partial<GaleriaCategoria> & {
    proyecto_id: string;
    nombre: string;
    slug: string;
  }
): Promise<GaleriaCategoria> {
  const { data: cat, error } = await supabase
    .from("galeria_categorias")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return cat;
}

export async function updateCategoria(
  id: string,
  data: Partial<GaleriaCategoria>
): Promise<GaleriaCategoria> {
  const { data: cat, error } = await supabase
    .from("galeria_categorias")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return cat;
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from("galeria_categorias")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function addImagenToCategoria(
  data: Partial<GaleriaImagen> & { categoria_id: string; url: string }
): Promise<GaleriaImagen> {
  const { data: img, error } = await supabase
    .from("galeria_imagenes")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return img;
}

export async function deleteImagen(id: string): Promise<void> {
  const { error } = await supabase
    .from("galeria_imagenes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function reorderImagenes(
  updates: { id: string; orden: number }[]
): Promise<void> {
  for (const { id, orden } of updates) {
    await supabase.from("galeria_imagenes").update({ orden }).eq("id", id);
  }
}

// ==================== VIDEOS ====================

export async function getVideosByProyecto(proyectoId: string): Promise<Video[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}

export async function createVideo(
  data: Partial<Video> & { proyecto_id: string; url: string }
): Promise<Video> {
  const { data: video, error } = await supabase
    .from("videos")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return video;
}

export async function updateVideo(
  id: string,
  data: Partial<Video>
): Promise<Video> {
  const { data: video, error } = await supabase
    .from("videos")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return video;
}

export async function deleteVideo(id: string): Promise<void> {
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) throw error;
}

// ==================== PUNTOS DE INTERES ====================

export async function getPuntosInteresByProyecto(proyectoId: string): Promise<PuntoInteres[]> {
  const { data, error } = await supabase
    .from("puntos_interes")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}

// ==================== RECURSOS ====================

export async function getRecursosByProyecto(proyectoId: string): Promise<Recurso[]> {
  const { data, error } = await supabase
    .from("recursos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}

// ==================== LEADS ====================

export async function createLead(
  data: Partial<Lead> & {
    proyecto_id: string;
    nombre: string;
    email: string;
  }
): Promise<Lead> {
  const { data: lead, error } = await supabase
    .from("leads")
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return lead;
}

export async function getLeadsByUser(filters?: {
  proyectoId?: string;
  tipologia?: string;
  search?: string;
}): Promise<Lead[]> {
  // First get user's projects
  const { data: proyectos } = await supabase.from("proyectos").select("id");
  if (!proyectos?.length) return [];

  const projectIds = proyectos.map((p) => p.id);

  let query = supabase
    .from("leads")
    .select("*")
    .in("proyecto_id", projectIds)
    .order("created_at", { ascending: false });

  if (filters?.proyectoId) {
    query = query.eq("proyecto_id", filters.proyectoId);
  }
  if (filters?.tipologia) {
    query = query.eq("tipologia_interes", filters.tipologia);
  }
  if (filters?.search) {
    query = query.or(
      `nombre.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// ==================== STORAGE ====================

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
