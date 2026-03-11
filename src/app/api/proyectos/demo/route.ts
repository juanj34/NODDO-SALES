import { getAuthContext } from "@/lib/auth-context";
import { NextResponse } from "next/server";
import { mockProyecto } from "@/data/mock";

export async function POST() {
  try {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const ts = Date.now();
    const slug = `demo-${ts}`;

    // 1. Create the base project
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .insert({
        user_id: auth.user.id,
        slug,
        subdomain: slug,
        nombre: mockProyecto.nombre,
        descripcion: mockProyecto.descripcion,
        constructora_nombre: mockProyecto.constructora_nombre,
        color_primario: mockProyecto.color_primario,
        color_secundario: mockProyecto.color_secundario,
        color_fondo: mockProyecto.color_fondo,
        estado: "borrador",
        disclaimer: mockProyecto.disclaimer,
        whatsapp_numero: mockProyecto.whatsapp_numero,
        ubicacion_direccion: mockProyecto.ubicacion_direccion,
        ubicacion_lat: mockProyecto.ubicacion_lat,
        ubicacion_lng: mockProyecto.ubicacion_lng,
        tour_360_url: mockProyecto.tour_360_url,
        brochure_url: mockProyecto.brochure_url,
        render_principal_url: mockProyecto.render_principal_url,
        fachada_url: mockProyecto.fachada_url,
      })
      .select()
      .single();

    if (projErr || !proyecto) {
      throw projErr || new Error("Failed to create project");
    }

    const projectId = proyecto.id;

    // 2. Create tipologias and build ID map
    const tipoIdMap = new Map<string, string>();
    for (const tipo of mockProyecto.tipologias) {
      const { data: created, error } = await auth.supabase
        .from("tipologias")
        .insert({
          proyecto_id: projectId,
          nombre: tipo.nombre,
          descripcion: tipo.descripcion,
          area_m2: tipo.area_m2,
          habitaciones: tipo.habitaciones,
          banos: tipo.banos,
          precio_desde: tipo.precio_desde,
          plano_url: tipo.plano_url,
          renders: tipo.renders,
          caracteristicas: tipo.caracteristicas,
          parqueaderos: tipo.parqueaderos,
          area_balcon: tipo.area_balcon,
          hotspots: tipo.hotspots,
          orden: tipo.orden,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (created) tipoIdMap.set(tipo.id, created.id);
    }

    // 3. Create fachada and build ID map
    const fachadaIdMap = new Map<string, string>();
    for (const fachada of mockProyecto.fachadas) {
      const { data: created, error } = await auth.supabase
        .from("fachadas")
        .insert({
          proyecto_id: projectId,
          nombre: fachada.nombre,
          imagen_url: fachada.imagen_url,
          orden: fachada.orden,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (created) fachadaIdMap.set(fachada.id, created.id);
    }

    // 4. Create unidades with remapped IDs
    const unidades = mockProyecto.unidades.map((u) => ({
      proyecto_id: projectId,
      tipologia_id: u.tipologia_id ? tipoIdMap.get(u.tipologia_id) || null : null,
      identificador: u.identificador,
      piso: u.piso,
      area_m2: u.area_m2,
      precio: u.precio,
      estado: u.estado,
      habitaciones: u.habitaciones,
      banos: u.banos,
      orientacion: u.orientacion,
      vista: u.vista,
      notas: u.notas,
      fachada_id: u.fachada_id ? fachadaIdMap.get(u.fachada_id) || null : null,
      fachada_x: u.fachada_x,
      fachada_y: u.fachada_y,
      orden: u.orden,
    }));

    if (unidades.length > 0) {
      const { error } = await auth.supabase.from("unidades").insert(unidades);
      if (error) throw error;
    }

    // 5. Create gallery categories + images
    for (const cat of mockProyecto.galeria_categorias) {
      const { data: createdCat, error: catErr } = await auth.supabase
        .from("galeria_categorias")
        .insert({
          proyecto_id: projectId,
          nombre: cat.nombre,
          slug: cat.slug,
          orden: cat.orden,
        })
        .select("id")
        .single();

      if (catErr) throw catErr;
      if (!createdCat) continue;

      const images = (cat.imagenes || []).map((img) => ({
        categoria_id: createdCat.id,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
        alt_text: img.alt_text,
        orden: img.orden,
      }));

      if (images.length > 0) {
        const { error } = await auth.supabase.from("galeria_imagenes").insert(images);
        if (error) throw error;
      }
    }

    // 6. Create videos
    const videos = mockProyecto.videos.map((v) => ({
      proyecto_id: projectId,
      titulo: v.titulo,
      url: v.url,
      thumbnail_url: v.thumbnail_url,
      orden: v.orden,
    }));
    if (videos.length > 0) {
      const { error } = await auth.supabase.from("videos").insert(videos);
      if (error) throw error;
    }

    // 7. Create puntos de interes
    const pois = mockProyecto.puntos_interes.map((p) => ({
      proyecto_id: projectId,
      nombre: p.nombre,
      descripcion: p.descripcion,
      categoria: p.categoria,
      imagen_url: p.imagen_url,
      ciudad: p.ciudad,
      lat: p.lat,
      lng: p.lng,
      distancia_km: p.distancia_km,
      tiempo_minutos: p.tiempo_minutos,
      orden: p.orden,
    }));
    if (pois.length > 0) {
      const { error } = await auth.supabase.from("puntos_interes").insert(pois);
      if (error) throw error;
    }

    // 8. Create recursos
    const recursos = mockProyecto.recursos.map((r) => ({
      proyecto_id: projectId,
      nombre: r.nombre,
      descripcion: r.descripcion,
      tipo: r.tipo,
      url: r.url,
      orden: r.orden,
    }));
    if (recursos.length > 0) {
      const { error } = await auth.supabase.from("recursos").insert(recursos);
      if (error) throw error;
    }

    return NextResponse.json({ id: projectId, slug }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear demo" },
      { status: 500 }
    );
  }
}
