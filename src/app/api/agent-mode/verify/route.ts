import { getAuthContext, verifyProjectOwnership } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/agent-mode/verify?proyecto_id=xxx
 *
 * Verifies that the authenticated user (admin or collaborator) has access
 * to the given project. Used by the microsite agent mode to confirm login.
 */
export async function GET(request: NextRequest) {
  try {
    const proyectoId = request.nextUrl.searchParams.get("proyecto_id");
    if (!proyectoId) {
      return NextResponse.json(
        { error: "proyecto_id is required" },
        { status: 400 }
      );
    }

    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check the project belongs to this user's admin account
    const hasAccess = await verifyProjectOwnership(auth, proyectoId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "No access to this project" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      allowed: true,
      user: {
        id: auth.user.id,
        email: auth.user.email,
        nombre: auth.profile?.nombre ?? null,
        apellido: auth.profile?.apellido ?? null,
      },
      role: auth.role,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
