import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    // Both admin and collaborator can access versions

    // Verify ownership (use adminUserId for filtering)
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Fetch versions (metadata only, no snapshot blob)
    const { data: versiones, error } = await auth.supabase
      .from("proyecto_versiones")
      .select("id, version_number, published_at, published_by")
      .eq("proyecto_id", id)
      .order("version_number", { ascending: false });

    if (error) throw error;

    return NextResponse.json(versiones || []);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
