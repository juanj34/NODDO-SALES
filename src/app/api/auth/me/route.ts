import { getAuthContext } from "@/lib/auth-context";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    return NextResponse.json({
      user: auth.user,
      role: auth.role,
      adminUserId: auth.adminUserId,
      isPlatformAdmin: auth.isPlatformAdmin,
      profile: auth.profile,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
