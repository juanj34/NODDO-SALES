import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-context";
import { deleteTourFiles } from "@/lib/r2";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ proyecto_id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { proyecto_id } = await params;

    // Verify project ownership
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", proyecto_id)
      .eq("user_id", auth.user.id)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    // Check if this is a tipología-specific tour delete
    const tipologiaId = new URL(request.url).searchParams.get("tipologia_id");
    const subpath = tipologiaId ? `tipologias/${tipologiaId}` : undefined;

    // Delete tour files from R2
    const deleted = await deleteTourFiles(proyecto_id, subpath);

    // Clear tour URL in DB
    if (tipologiaId) {
      await auth.supabase
        .from("tipologias")
        .update({ tour_360_url: null })
        .eq("id", tipologiaId)
        .eq("proyecto_id", proyecto_id);
    } else {
      await auth.supabase
        .from("proyectos")
        .update({ tour_360_url: null, storage_tours_bytes: 0 })
        .eq("id", proyecto_id);
    }

    return NextResponse.json({ deleted });
  } catch (err) {
    console.error("[tours/delete] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al eliminar tour" },
      { status: 500 }
    );
  }
}
