import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { NextRequest, NextResponse } from "next/server";

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

  // Get the admin record to check
  const { data: record } = await admin
    .from("platform_admins")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!record) {
    return NextResponse.json({ error: "Admin no encontrado" }, { status: 404 });
  }

  // Cannot remove self
  if (record.user_id === auth.user.id) {
    return NextResponse.json(
      { error: "No puedes removerte a ti mismo" },
      { status: 400 }
    );
  }

  const { error } = await admin.from("platform_admins").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email ?? "",
    action: "admin_removed",
    targetType: "admin",
    targetId: record.user_id,
    details: { email: record.email },
  });

  return NextResponse.json({ ok: true });
}
