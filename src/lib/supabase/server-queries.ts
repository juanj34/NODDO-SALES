import { createClient as createServerClient } from "@supabase/supabase-js";
import { createClient } from "./server";
import type {
  Proyecto,
  ProyectoCompleto,
  Tipologia,
  GaleriaCategoria,
  Video,
  Lead,
} from "@/types";

/**
 * Public Supabase client — no cookies(), safe inside unstable_cache.
 * Uses anon key so RLS still applies.
 * Hoisted to module level: config is static, avoids recreating per call.
 */
const publicClient = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/** Only allow valid slug/subdomain characters to prevent PostgREST filter injection */
const VALID_SLUG_RE = /^[a-z0-9][a-z0-9_-]*$/i;

// Server-side queries using the server client (for API routes + server components)

export async function getProyectosByUser(): Promise<Proyecto[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500); // Reasonable limit - most users won't have 500+ projects

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
    { data: recursos },
    { data: unidades },
    { data: fachadas },
    { data: torres },
    { data: planos },
    { data: avancesObra },
    { data: complementos },
    { data: vistasPiso },
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
    supabase.from("recursos").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("unidades").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("fachadas").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("torres").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("planos_interactivos").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("avances_obra").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("complementos").select("*").eq("proyecto_id", id).order("orden"),
    supabase.from("vistas_piso").select("*").eq("proyecto_id", id).order("orden"),
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

  // Load plano puntos
  const planoIds = (planos || []).map((p: { id: string }) => p.id);
  const { data: planoPuntos } = planoIds.length > 0
    ? await supabase.from("plano_puntos").select("*").in("plano_id", planoIds).order("orden")
    : { data: [] };

  return {
    ...proyecto,
    tipologias: tipologias || [],
    galeria_categorias: categoriasConImagenes,
    videos: videos || [],
    puntos_interes: puntosInteres || [],
    recursos: recursos || [],
    unidades: unidades || [],
    fachadas: fachadas || [],
    torres: torres || [],
    planos_interactivos: planos || [],
    plano_puntos: planoPuntos || [],
    avances_obra: avancesObra || [],
    complementos: complementos || [],
    vistas_piso: vistasPiso || [],
  };
}

export async function getProyectoBySlug(
  slugOrSubdomain: string
): Promise<ProyectoCompleto | null> {
  // Sanitize input: only allow valid slug characters (a-z, 0-9, hyphens, underscores)
  if (!VALID_SLUG_RE.test(slugOrSubdomain)) return null;

  // 1. Find published project by slug OR subdomain
  const { data: proyecto, error } = await publicClient
    .from("proyectos")
    .select("id")
    .or(`slug.eq.${slugOrSubdomain},subdomain.eq.${slugOrSubdomain}`)
    .eq("estado", "publicado")
    .limit(1)
    .maybeSingle();

  if (error || !proyecto) return null;

  // 2. Fetch latest published snapshot
  const { data: version } = await publicClient
    .from("proyecto_versiones")
    .select("snapshot")
    .eq("proyecto_id", proyecto.id)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (!version?.snapshot) return null;

  // 3. Reconstruct ProyectoCompleto from snapshot
  const snap = version.snapshot as Record<string, unknown>;
  const snapProyecto = snap.proyecto as Record<string, unknown>;

  return {
    ...snapProyecto,
    tipologias: (snap.tipologias as ProyectoCompleto["tipologias"]) || [],
    galeria_categorias: (snap.galeria_categorias as ProyectoCompleto["galeria_categorias"]) || [],
    videos: (snap.videos as ProyectoCompleto["videos"]) || [],
    puntos_interes: (snap.puntos_interes as ProyectoCompleto["puntos_interes"]) || [],
    unidades: (snap.unidades as ProyectoCompleto["unidades"]) || [],
    recursos: (snap.recursos as ProyectoCompleto["recursos"]) || [],
    fachadas: (snap.fachadas as ProyectoCompleto["fachadas"]) || [],
    torres: (snap.torres as ProyectoCompleto["torres"]) || [],
    planos_interactivos: (snap.planos_interactivos as ProyectoCompleto["planos_interactivos"]) || [],
    plano_puntos: (snap.plano_puntos as ProyectoCompleto["plano_puntos"]) || [],
    avances_obra: (snap.avances_obra as ProyectoCompleto["avances_obra"]) || [],
    complementos: (snap.complementos as ProyectoCompleto["complementos"]) || [],
    vistas_piso: (snap.vistas_piso as ProyectoCompleto["vistas_piso"]) || [],
  } as ProyectoCompleto;
}

export async function getLeadsByProyectos(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data: proyectos } = await supabase.from("proyectos").select("id").limit(500);
  if (!proyectos?.length) return [];

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .in(
      "proyecto_id",
      proyectos.map((p) => p.id)
    )
    .order("created_at", { ascending: false })
    .limit(1000); // Limit to most recent 1000 leads for performance

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
    .order("orden")
    .limit(100); // Max 100 tipologías per project (reasonable limit)

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
    .order("orden")
    .limit(50); // Max 50 videos per project (reasonable limit)

  if (error) throw error;
  return data || [];
}
