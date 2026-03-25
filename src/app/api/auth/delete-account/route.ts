import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();

  // Delete all projects owned by this user (cascades to tipologias, galeria, leads, etc.)
  if (auth.role === "admin") {
    await adminSupabase
      .from("proyectos")
      .delete()
      .eq("user_id", auth.user.id);

    // Remove any collaborator records where this user is admin
    await adminSupabase
      .from("colaboradores")
      .delete()
      .eq("admin_user_id", auth.user.id);
  }

  // If collaborator (director or asesor), remove the collaborator record
  if (auth.role === "director" || auth.role === "asesor") {
    await adminSupabase
      .from("colaboradores")
      .delete()
      .eq("colaborador_user_id", auth.user.id);
  }

  // Delete the auth user
  const { error } = await adminSupabase.auth.admin.deleteUser(auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
