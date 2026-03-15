import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const { moderation_status, moderation_notes } = body;

  // Validar status
  if (!["approved", "rejected", "flagged", "pending"].includes(moderation_status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Actualizar proyecto
  const { data, error } = await admin
    .from("proyectos")
    .update({
      moderation_status,
      moderation_notes: moderation_notes || null,
      moderated_at: new Date().toISOString(),
      moderated_by: auth.user.id,
    })
    .eq("id", id)
    .select("id, nombre, slug")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Error al actualizar proyecto" }, { status: 500 });
  }

  // Audit log
  await logAdminAction({
    userId: auth.user.id,
    action: "project_moderated",
    resourceType: "proyecto",
    resourceId: id,
    metadata: {
      moderation_status,
      moderation_notes,
      project_name: data.nombre,
    },
  });

  return NextResponse.json({ success: true, data });
}
