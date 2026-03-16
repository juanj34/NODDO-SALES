import { getAuthContext } from "@/lib/auth-context";
import { revalidateProyecto } from "@/lib/supabase/cached-queries";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth)
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin")
      return NextResponse.json(
        { error: "Solo administradores" },
        { status: 403 }
      );

    // Verify ownership
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, estado, slug, subdomain")
      .eq("id", id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (projErr || !proyecto) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }

    if (proyecto.estado !== "publicado") {
      return NextResponse.json(
        { error: "El proyecto no está publicado" },
        { status: 400 }
      );
    }

    const { error: updateErr } = await auth.supabase
      .from("proyectos")
      .update({ estado: "borrador" })
      .eq("id", id)
      .eq("user_id", auth.adminUserId);

    if (updateErr) throw updateErr;

    // Revalidate cached microsite data
    await revalidateProyecto(proyecto.slug);
    if (proyecto.subdomain && proyecto.subdomain !== proyecto.slug) {
      await revalidateProyecto(proyecto.subdomain);
    }

    return NextResponse.json({ estado: "borrador" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al despublicar" },
      { status: 500 }
    );
  }
}
