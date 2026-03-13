import { getAuthContext } from "@/lib/auth-context";
import { getVideoStatus } from "@/lib/cloudflare-stream";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );

    // Get status from Cloudflare Stream
    const status = await getVideoStatus(uid);

    // Update DB record based on status
    if (status.readyToStream) {
      await auth.supabase
        .from("videos")
        .update({
          stream_status: "ready",
          duration: status.duration,
          size_bytes: status.size,
          thumbnail_url: status.thumbnail,
        })
        .eq("stream_uid", uid);
    } else if (status.state === "error") {
      await auth.supabase
        .from("videos")
        .update({ stream_status: "error" })
        .eq("stream_uid", uid);
    } else if (status.state !== "pendingupload") {
      // Processing states (downloading, queued, inprogress)
      await auth.supabase
        .from("videos")
        .update({ stream_status: "processing" })
        .eq("stream_uid", uid);
    }

    return NextResponse.json({
      stream_uid: uid,
      ready: status.readyToStream,
      state: status.state,
      pct_complete: status.pctComplete,
      duration: status.duration,
      size: status.size,
      thumbnail: status.thumbnail,
      error_reason: status.errorReasonText,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
