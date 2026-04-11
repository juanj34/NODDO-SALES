import { pick } from "@/lib/api-utils";
import { logActivity } from "@/lib/activity-logger";
import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { deleteStreamVideo } from "@/lib/cloudflare-stream";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    const body = await request.json();
    const { data, error } = await auth.supabase
      .from("videos")
      .update(pick(body, ["titulo", "url", "thumbnail_url", "orden", "stream_uid", "stream_status", "duration", "size_bytes"]))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: data.proyecto_id,
      actionType: "video.update",
      actionCategory: "video",
      metadata: { titulo: data.titulo },
      entityType: "video",
      entityId: id,
    });

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // If this is a Stream-hosted video, delete from Cloudflare first
    const { data: video } = await auth.supabase
      .from("videos")
      .select("stream_uid, proyecto_id, titulo")
      .eq("id", id)
      .single();

    if (video?.stream_uid) {
      await deleteStreamVideo(video.stream_uid);
    }

    const { error } = await auth.supabase.from("videos").delete().eq("id", id);

    if (error) throw error;

    logActivity({
      userId: auth.user.id,
      userEmail: auth.user.email!,
      userRole: auth.role,
      proyectoId: video?.proyecto_id,
      actionType: "video.delete",
      actionCategory: "video",
      metadata: { titulo: video?.titulo },
      entityType: "video",
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
