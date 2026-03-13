import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Get user from auth
  const { data: userData, error: userError } = await admin.auth.admin.getUserById(id);
  if (userError || !userData?.user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const user = userData.user;

  // Get user's projects, plan, and lead count in parallel
  const [projectsRes, planRes, leadsRes] = await Promise.all([
    admin
      .from("proyectos")
      .select("id, nombre, slug, estado, created_at, render_principal_url")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    admin
      .from("user_plans")
      .select("*")
      .eq("user_id", id)
      .limit(1)
      .maybeSingle(),
    admin
      .from("leads")
      .select("proyecto_id, proyectos!inner(user_id)")
      .eq("proyectos.user_id", id),
  ]);

  return NextResponse.json({
    id: user.id,
    email: user.email ?? "",
    created_at: user.created_at,
    last_sign_in_at: user.last_sign_in_at ?? null,
    banned: !!user.banned_until,
    projects: projectsRes.data ?? [],
    plan: planRes.data ?? null,
    leadCount: leadsRes.data?.length ?? 0,
  });
}

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

  // Suspend/activate user via Supabase auth admin
  if (body.banned !== undefined) {
    const { error } = await admin.auth.admin.updateUserById(id, {
      ban_duration: body.banned ? "876600h" : "none",
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
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

  // Archive all user's projects
  await admin
    .from("proyectos")
    .update({ estado: "archivado" })
    .eq("user_id", id);

  // Delete plan record
  await admin.from("user_plans").delete().eq("user_id", id);

  // Delete collaborator records (where user is collaborator)
  await admin.from("colaboradores").delete().eq("colaborador_user_id", id);

  // Delete the auth user (cascades platform_admins if any)
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
