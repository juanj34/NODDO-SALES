import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Verify ownership via proyecto_id
    const { data: plano } = await auth.supabase
      .from("planos_interactivos")
      .select("proyecto_id")
      .eq("id", id)
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
    const { data, error } = await auth.supabase
      .from("planos_interactivos")
      .update(body)
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
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Verify ownership via proyecto_id
    const { data: plano } = await auth.supabase
      .from("planos_interactivos")
      .select("proyecto_id")
      .eq("id", id)
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

    // CASCADE will delete associated plano_puntos
    const { error } = await auth.supabase
      .from("planos_interactivos")
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
