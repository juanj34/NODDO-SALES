import { getAuthContext } from "@/lib/auth-context";
import { sendCollaboratorInvite } from "@/lib/email";
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
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Verify collaborator belongs to this admin and is pending
    const { data: colab, error } = await auth.supabase
      .from("colaboradores")
      .select("id, email, estado")
      .eq("id", id)
      .eq("admin_user_id", auth.user.id)
      .single();

    if (error || !colab) {
      return NextResponse.json({ error: "Colaborador no encontrado" }, { status: 404 });
    }

    if (colab.estado !== "pendiente") {
      return NextResponse.json({ error: "Solo se puede reenviar a invitaciones pendientes" }, { status: 400 });
    }

    await sendCollaboratorInvite({
      email: colab.email,
      inviterName: auth.user.email || "Un administrador",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
