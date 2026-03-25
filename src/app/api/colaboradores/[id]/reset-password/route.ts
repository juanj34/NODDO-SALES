import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    // Fetch the collaborator to get their email
    const { data: colab, error: fetchError } = await auth.supabase
      .from("colaboradores")
      .select("email, estado, colaborador_user_id")
      .eq("id", id)
      .eq("admin_user_id", auth.user.id)
      .single();

    if (fetchError || !colab) {
      return NextResponse.json(
        { error: "Colaborador no encontrado" },
        { status: 404 }
      );
    }

    if (colab.estado !== "activo") {
      return NextResponse.json(
        { error: "Solo se puede resetear la contraseña de colaboradores activos" },
        { status: 400 }
      );
    }

    // Send password reset email via Supabase admin
    const supabaseAdmin = createAdminClient();
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      colab.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback?redirect=/proyectos`,
      }
    );

    if (resetError) {
      throw resetError;
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
