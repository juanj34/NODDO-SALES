import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const admin = createAdminClient();

  const VALID_ESTADOS = ["borrador", "publicado", "archivado"];
  const VALID_PLANS = ["basico", "pro"];

  if (body.estado !== undefined && !VALID_ESTADOS.includes(body.estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  if (body.plan !== undefined && !VALID_PLANS.includes(body.plan)) {
    return NextResponse.json({ error: "Plan inválido. Opciones: basico, pro" }, { status: 400 });
  }

  const updates: Record<string, string | number> = {};
  if (body.estado !== undefined) updates.estado = body.estado;
  if (body.plan !== undefined) {
    updates.plan = body.plan;
    // Update storage limit based on new plan
    updates.storage_limit_bytes = body.plan === "pro" ? 53687091200 : 10737418240; // 50GB : 10GB
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const { error } = await admin.from("proyectos").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log plan changes
  if (body.plan !== undefined) {
    await logAdminAction({
      adminId: auth.user.id,
      adminEmail: auth.user.email ?? "",
      action: "project_plan_changed",
      targetType: "project",
      targetId: id,
      details: { plan: body.plan },
    });
    // Log to billing_events
    const { data: proyecto } = await admin.from("proyectos").select("user_id").eq("id", id).single();
    if (proyecto) {
      await admin.from("billing_events").insert({
        user_id: proyecto.user_id,
        event_type: "plan_assigned",
        details: { proyecto_id: id, plan: body.plan },
      });
    }
  }

  if (body.estado === "archivado") {
    await logAdminAction({
      adminId: auth.user.id,
      adminEmail: auth.user.email ?? "",
      action: "project_archived",
      targetType: "project",
      targetId: id,
      details: { estado: body.estado },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Delete related data in order (children first)
  // Leads reference proyecto_id
  await admin.from("leads").delete().eq("proyecto_id", id);
  // Unidades reference proyecto_id
  await admin.from("unidades").delete().eq("proyecto_id", id);
  // Gallery images reference categoria, categorias reference proyecto
  const { data: categorias } = await admin
    .from("galeria_categorias")
    .select("id")
    .eq("proyecto_id", id);
  if (categorias && categorias.length > 0) {
    const catIds = categorias.map((c) => c.id);
    await admin.from("galeria_imagenes").delete().in("categoria_id", catIds);
    await admin.from("galeria_categorias").delete().eq("proyecto_id", id);
  }
  // Tipologias
  await admin.from("tipologias").delete().eq("proyecto_id", id);
  // Videos
  await admin.from("videos").delete().eq("proyecto_id", id);
  // POIs
  await admin.from("puntos_interes").delete().eq("proyecto_id", id);
  // Torres
  await admin.from("torres").delete().eq("proyecto_id", id);
  // The project itself
  const { error } = await admin.from("proyectos").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email ?? "",
    action: "project_deleted",
    targetType: "project",
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
