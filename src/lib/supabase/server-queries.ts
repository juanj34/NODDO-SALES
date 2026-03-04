import { createClient } from "./server";
import type {
  Proyecto,
  ProyectoCompleto,
  Tipologia,
  GaleriaCategoria,
  Video,
  Lead,
} from "@/types";

// Server-side queries using the server client (for API routes + server components)

export async function getProyectosByUser(): Promise<Proyecto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProyectoById(
  id: string
): Promise<ProyectoCompleto | null> {
  const supabase = await createClient();
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !proyecto) return null;

  const [
    { data: tipologias },
    { data: categorias },
    { data: videos },
    { data: puntosInteres },
  ] = await Promise.all([
    supabase
      .from("tipologias")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden"),
    supabase
      .from("galeria_categorias")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden"),
    supabase.from("videos").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("puntos_interes").select("*").eq("proyecto_id", id).order("orden"),
  ]);

  // Load images for each category
  const categoriasConImagenes: GaleriaCategoria[] = await Promise.all(
    (categorias || []).map(async (cat) => {
      const { data: imagenes } = await supabase
        .from("galeria_imagenes")
        .select("*")
        .eq("categoria_id", cat.id)
        .order("orden");
      return { ...cat, imagenes: imagenes || [] };
    })
  );

  return {
    ...proyecto,
    tipologias: tipologias || [],
    galeria_categorias: categoriasConImagenes,
    videos: videos || [],
    puntos_interes: puntosInteres || [],
  };
}

export async function getProyectoBySlug(
  slug: string
): Promise<ProyectoCompleto | null> {
  const supabase = await createClient();
  const { data: proyecto, error } = await supabase
    .from("proyectos")
    .select("*")
    .eq("slug", slug)
    .eq("estado", "publicado")
    .single();

  if (error || !proyecto) return null;

  const [
    { data: tipologias },
    { data: categorias },
    { data: videos },
    { data: puntosInteres },
  ] = await Promise.all([
    supabase
      .from("tipologias")
      .select("*")
      .eq("proyecto_id", proyecto.id)
      .order("orden"),
    supabase
      .from("galeria_categorias")
      .select("*")
      .eq("proyecto_id", proyecto.id)
      .order("orden"),
    supabase
      .from("videos")
      .select("*")
      .eq("proyecto_id", proyecto.id)
      .order("orden"),
    supabase
      .from("puntos_interes")
      .select("*")
      .eq("proyecto_id", proyecto.id)
      .order("orden"),
  ]);

  const categoriasConImagenes: GaleriaCategoria[] = await Promise.all(
    (categorias || []).map(async (cat) => {
      const { data: imagenes } = await supabase
        .from("galeria_imagenes")
        .select("*")
        .eq("categoria_id", cat.id)
        .order("orden");
      return { ...cat, imagenes: imagenes || [] };
    })
  );

  return {
    ...proyecto,
    tipologias: tipologias || [],
    galeria_categorias: categoriasConImagenes,
    videos: videos || [],
    puntos_interes: puntosInteres || [],
  };
}

export async function getLeadsByProyectos(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data: proyectos } = await supabase.from("proyectos").select("id");
  if (!proyectos?.length) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in(
      "proyecto_id",
      proyectos.map((p) => p.id)
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTipologiasByProyecto(
  proyectoId: string
): Promise<Tipologia[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tipologias")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}

export async function getVideosByProyecto(
  proyectoId: string
): Promise<Video[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("proyecto_id", proyectoId)
    .order("orden");

  if (error) throw error;
  return data || [];
}
