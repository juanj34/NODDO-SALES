import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Queries en paralelo
  const [pendingRes, flaggedRes, rejectedRes, recentRes] = await Promise.all([
    // Proyectos pendientes de moderación
    admin
      .from("proyectos")
      .select("id, nombre, slug, estado, render_principal_url, created_at, moderation_notes")
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false }),

    // Proyectos flaggeados
    admin
      .from("proyectos")
      .select("id, nombre, slug, estado, render_principal_url, created_at, moderation_notes")
      .eq("moderation_status", "flagged")
      .order("created_at", { ascending: false }),

    // Proyectos rechazados (últimos 10)
    admin
      .from("proyectos")
      .select("id, nombre, slug, estado, moderation_notes, moderated_at")
      .eq("moderation_status", "rejected")
      .order("moderated_at", { ascending: false })
      .limit(10),

    // Moderaciones recientes (últimos 20)
    admin
      .from("proyectos")
      .select("id, nombre, slug, moderation_status, moderated_at")
      .not("moderated_at", "is", null)
      .order("moderated_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({
    pending: pendingRes.data ?? [],
    flagged: flaggedRes.data ?? [],
    rejected: rejectedRes.data ?? [],
    recent_actions: recentRes.data ?? [],
  });
}
