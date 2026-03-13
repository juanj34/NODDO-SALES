import { getAuthContext } from "@/lib/auth-context";
import { createDirectUpload } from "@/lib/cloudflare-stream";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );

    const body = await request.json();
    const { proyecto_id, filename } = body;

    if (!proyecto_id || !filename) {
      return NextResponse.json(
        { error: "proyecto_id y filename son requeridos" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Create direct upload URL on Cloudflare Stream
    const { uid, uploadURL } = await createDirectUpload(proyecto_id);

    // Get current max orden
    const { data: maxOrden } = await auth.supabase
      .from("videos")
      .select("orden")
      .eq("proyecto_id", proyecto_id)
      .order("orden", { ascending: false })
      .limit(1)
      .single();

    const nextOrden = (maxOrden?.orden ?? -1) + 1;

    // Strip extension from filename for title
    const titulo = filename.replace(/\.[^.]+$/, "");

    // Create video record in DB
    const { data: video, error } = await auth.supabase
      .from("videos")
      .insert({
        proyecto_id,
        titulo,
        url: "",
        stream_uid: uid,
        stream_status: "uploading",
        orden: nextOrden,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      video_id: video.id,
      upload_url: uploadURL,
      stream_uid: uid,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
