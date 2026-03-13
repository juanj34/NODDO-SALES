import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );

    // Get project storage fields
    const { data: project, error: projError } = await auth.supabase
      .from("proyectos")
      .select(
        "storage_tours_bytes, storage_videos_bytes, storage_media_bytes, storage_limit_bytes"
      )
      .eq("id", id)
      .single();

    if (projError || !project)
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );

    // Calculate actual video storage from videos table
    const { data: videos } = await auth.supabase
      .from("videos")
      .select("size_bytes")
      .eq("proyecto_id", id)
      .not("stream_uid", "is", null)
      .not("size_bytes", "is", null);

    const videosBytes =
      videos?.reduce(
        (sum: number, v: { size_bytes: number | null }) =>
          sum + (v.size_bytes || 0),
        0
      ) || 0;

    const toursBytes = project.storage_tours_bytes || 0;
    const mediaBytes = project.storage_media_bytes || 0;
    const totalBytes = videosBytes + toursBytes + mediaBytes;
    const limitBytes = project.storage_limit_bytes || 5368709120;

    return NextResponse.json({
      tours_bytes: toursBytes,
      videos_bytes: videosBytes,
      media_bytes: mediaBytes,
      total_bytes: totalBytes,
      limit_bytes: limitBytes,
      pct_used: Math.min(
        100,
        Math.round((totalBytes / limitBytes) * 100)
      ),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
