import { pick } from "@/lib/api-utils";
import { getAuthContext } from "@/lib/auth-context";
import { checkFeature } from "@/lib/feature-flags";
import { checkFeatureAccess, FEATURE_LABELS } from "@/lib/feature-access";
import { sendFeatureBlocked } from "@/lib/email";
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

    // Check plan-based access first
    const planAccess = await checkFeatureAccess(auth.supabase, auth.adminUserId, "video_hosting");
    if (!planAccess.allowed) {
      // Send feature blocked email (fire-and-forget)
      if (auth.user.email && planAccess.requiredPlan) {
        sendFeatureBlocked({
          email: auth.user.email,
          name: auth.user.user_metadata?.full_name || auth.user.email.split("@")[0],
          feature: FEATURE_LABELS.video_hosting,
          currentPlan: planAccess.currentPlan,
          requiredPlan: planAccess.requiredPlan,
        }).catch((err) => {
          console.error("[videos] Failed to send feature blocked email:", err);
        });
      }

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

    // Check feature flag for project (allows Enterprise to disable per-project)
    const videoEnabled = await checkFeature(auth.supabase, body.proyecto_id, "video_hosting");
    if (!videoEnabled) {
      return NextResponse.json(
        { error: "Video Hosting no está habilitado para este proyecto" },
        { status: 403 }
      );
    }

    const { data, error } = await auth.supabase
      .from("videos")
      .insert(pick(body, ["proyecto_id", "titulo", "url", "thumbnail_url", "orden", "stream_uid", "stream_status", "duration", "size_bytes"]))
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
