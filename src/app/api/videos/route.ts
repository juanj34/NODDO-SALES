import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { checkFeature } from "@/lib/feature-flags";
import { checkFeatureAccess } from "@/lib/feature-access";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const body = await request.json();
    if (!body.proyecto_id || (!body.url && !body.stream_uid)) {
      return NextResponse.json(
        { error: "proyecto_id y url (o stream_uid) son requeridos" },
        { status: 400 }
      );
    }

    // Only check video_hosting feature for Cloudflare Stream uploads.
    // Plain YouTube URL references don't consume hosting resources.
    if (body.stream_uid) {
      const planAccess = await checkFeatureAccess(auth.supabase, auth.adminUserId, "video_hosting");
      if (!planAccess.allowed) {
        return NextResponse.json(
          {
            error: `Video hosting requiere plan ${planAccess.requiredPlan}`,
            upgrade_required: true,
            current_plan: planAccess.currentPlan,
            required_plan: planAccess.requiredPlan,
          },
          { status: 403 }
        );
      }

      const videoEnabled = await checkFeature(auth.supabase, body.proyecto_id, "video_hosting");
      if (!videoEnabled) {
        return NextResponse.json(
          { error: "Video Hosting no está habilitado para este proyecto" },
          { status: 403 }
        );
      }
    }

    // Auto-generate YouTube thumbnail if not provided
    const insertData = pick(body, ["proyecto_id", "titulo", "url", "thumbnail_url", "orden", "stream_uid", "stream_status", "duration", "size_bytes"]);
    if (!insertData.thumbnail_url && insertData.url && typeof insertData.url === "string") {
      const ytMatch = (insertData.url as string).match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      );
      if (ytMatch) {
        insertData.thumbnail_url = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
      }
    }

    const { data, error } = await auth.supabase
      .from("videos")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
