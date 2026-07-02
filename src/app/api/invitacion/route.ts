import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Context for the /invitacion onboarding page.
 * Returns the collaborator's role, who invited them, and their current profile.
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Not a collaborator (regular admin account) — nothing to onboard
  if (auth.role === "admin") {
    return NextResponse.json({ colaborador: false });
  }

  // Resolve the inviting admin's display name (their profile is not visible
  // to the collaborator under RLS, so use the service-role client).
  let inviterName = "Un administrador";
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data: adminProfile } = await admin
        .from("user_profiles")
        .select("nombre, apellido")
        .eq("user_id", auth.adminUserId)
        .maybeSingle();

      const fullName = [adminProfile?.nombre, adminProfile?.apellido]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (fullName) {
        inviterName = fullName;
      } else {
        const { data: adminUser } = await admin.auth.admin.getUserById(auth.adminUserId);
        if (adminUser?.user?.email) inviterName = adminUser.user.email;
      }
    } catch {
      // Non-critical — keep the generic fallback
    }
  }

  return NextResponse.json({
    colaborador: true,
    rol: auth.role,
    inviterName,
    nombre: auth.profile?.nombre || "",
    apellido: auth.profile?.apellido || "",
  });
}
