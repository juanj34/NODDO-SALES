import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
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
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    const { data, error } = await auth.supabase
      .from("videos")
      .update(pick(body, ["titulo", "url", "thumbnail_url", "orden", "stream_uid", "stream_status", "duration", "size_bytes"]))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
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
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // If this is a Stream-hosted video, delete from Cloudflare first
    const { data: video } = await auth.supabase
      .from("videos")
      .select("stream_uid")
      .eq("id", id)
      .single();

    if (video?.stream_uid) {
      await deleteStreamVideo(video.stream_uid);
    }

    const { error } = await auth.supabase.from("videos").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
