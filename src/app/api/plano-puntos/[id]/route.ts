import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // Verify ownership: plano_punto -> plano -> proyecto
    const { data: punto } = await auth.supabase
      .from("plano_puntos")
      .select("plano_id")
      .eq("id", id)
      .single();

    if (!punto) {
      return NextResponse.json(
        { error: "Punto no encontrado" },
        { status: 404 }
      );
    }

    const { data: plano } = await auth.supabase
      .from("planos_interactivos")
      .select("proyecto_id")
      .eq("id", punto.plano_id)
      .single();

    if (!plano) {
      return NextResponse.json(
        { error: "Plano no encontrado" },
        { status: 404 }
      );
    }

    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", plano.proyecto_id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["titulo", "descripcion", "imagen_url", "render_url", "renders", "fachada_id", "torre_id", "x", "y", "orden"];
    for (const field of allowedFields) {
      if (body[field] !== undefined) updateData[field] = body[field];
    }

    const { data, error } = await auth.supabase
      .from("plano_puntos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const denied = requirePermission(auth, "content.write");
    if (denied) return denied;

    // Verify ownership: plano_punto -> plano -> proyecto
    const { data: punto } = await auth.supabase
      .from("plano_puntos")
      .select("plano_id")
      .eq("id", id)
      .single();

    if (!punto) {
      return NextResponse.json(
        { error: "Punto no encontrado" },
        { status: 404 }
      );
    }

    const { data: plano } = await auth.supabase
      .from("planos_interactivos")
      .select("proyecto_id")
      .eq("id", punto.plano_id)
      .single();

    if (!plano) {
      return NextResponse.json(
        { error: "Plano no encontrado" },
        { status: 404 }
      );
    }

    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("id")
      .eq("id", plano.proyecto_id)
      .eq("user_id", auth.adminUserId)
      .single();

    if (!proyecto) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { error } = await auth.supabase
      .from("plano_puntos")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
