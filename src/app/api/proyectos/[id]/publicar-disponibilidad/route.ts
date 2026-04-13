import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // All roles (admin, director, asesor) can publish availability
    const isAdmin = auth.role === "admin" || auth.role === "administrador";

    // Verify project ownership (admin) or access (collaborator)
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, user_id")
      .eq("id", id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    if (isAdmin && proyecto.user_id !== auth.adminUserId) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    // 1. Get the latest published version
    const { data: latestVersion, error: versionErr } = await auth.supabase
      .from("proyecto_versiones")
      .select("id, snapshot")
      .eq("proyecto_id", id)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    if (versionErr || !latestVersion) {
      return NextResponse.json(
        { error: "No hay versión publicada. Publica el proyecto completo primero." },
        { status: 400 }
      );
    }

    // 2. Fetch current unidades from DB
    const { data: currentUnidades, error: unidadesErr } = await auth.supabase
      .from("unidades")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden");

    if (unidadesErr) throw unidadesErr;

    // 3. Update only the unidades in the snapshot
    const updatedSnapshot = {
      ...(latestVersion.snapshot as Record<string, unknown>),
      unidades: currentUnidades || [],
    };

    const { error: updateErr } = await auth.supabase
      .from("proyecto_versiones")
      .update({ snapshot: updatedSnapshot })
      .eq("id", latestVersion.id);

    if (updateErr) throw updateErr;

    return NextResponse.json({
      updated: true,
      unidades_count: (currentUnidades || []).length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al publicar disponibilidad" },
      { status: 500 }
    );
  }
}
