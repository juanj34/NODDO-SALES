import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("platform_admins")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find user by email
  const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000, page: 1 });
  const targetUser = authData?.users?.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!targetUser) {
    return NextResponse.json(
      { error: "No se encontró un usuario con ese email" },
      { status: 404 }
    );
  }

  // Check if already admin
  const { data: existing } = await admin
    .from("platform_admins")
    .select("id")
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Este usuario ya es administrador de plataforma" },
      { status: 409 }
    );
  }

  // Insert
  const { data: inserted, error } = await admin
    .from("platform_admins")
    .insert({
      user_id: targetUser.id,
      email: targetUser.email ?? email,
      nombre: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email ?? "",
    action: "admin_added",
    targetType: "admin",
    targetId: targetUser.id,
    details: { email: targetUser.email },
  });

  return NextResponse.json(inserted);
}
