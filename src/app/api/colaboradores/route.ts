import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCollaboratorInvite, getUserLocale } from "@/lib/email";
import { checkCollaboratorLimit } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { data, error } = await auth.supabase
      .from("colaboradores")
      .select("*")
      .eq("admin_user_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (auth.role !== "admin") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const body = await request.json();
    const { email, nombre } = body;

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    // Check dynamic collaborator limit from user plan
    const collabLimit = await checkCollaboratorLimit(auth.supabase, auth.user.id);
    if (!collabLimit.allowed) {
      return NextResponse.json(
        { error: `Máximo ${collabLimit.max} colaboradores permitidos` },
        { status: 400 }
      );
    }

    // Check not inviting yourself
    if (email.toLowerCase() === auth.user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "No puedes invitarte a ti mismo" },
        { status: 400 }
      );
    }

    // Use admin client to check if user already exists or to invite
    const supabaseAdmin = createAdminClient();

    // Check if this email already has a Supabase auth account
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    let colaboradorUserId: string | null = null;
    let estado: "pendiente" | "activo" = "pendiente";

    if (existingUser) {
      // User already has an account — link directly
      colaboradorUserId = existingUser.id;
      estado = "activo";
    } else {
      // Send invitation email via Supabase
      const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/auth/callback?redirect=/proyectos` }
      );
      if (inviteError) {
        // If "already registered" error, try to find user
        if (inviteError.message?.includes("already")) {
          estado = "pendiente";
        } else {
          throw inviteError;
        }
      }
    }

    // Create colaborador record
    const { data, error } = await auth.supabase
      .from("colaboradores")
      .insert({
        admin_user_id: auth.user.id,
        colaborador_user_id: colaboradorUserId,
        email: email.toLowerCase(),
        nombre: nombre || null,
        estado,
        activated_at: estado === "activo" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este email ya fue invitado" },
          { status: 409 }
        );
      }
      throw error;
    }

    // Send invite email (non-blocking, admin's locale)
    const adminLocale = await getUserLocale(auth.supabase, auth.user.id);
    sendCollaboratorInvite({
      email: email.toLowerCase(),
      inviterName: auth.user.email || "Un administrador",
      locale: adminLocale,
    }).catch((err) => console.error("[collab] invite email error:", err));

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
