import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCollaboratorInvite, getUserLocale } from "@/lib/email";
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

    // Enrich with user_profiles for active collaborators
    const activeUserIds = (data || [])
      .filter((c: { colaborador_user_id: string | null }) => c.colaborador_user_id)
      .map((c: { colaborador_user_id: string }) => c.colaborador_user_id);

    let profileMap: Record<string, { nombre: string; apellido: string; telefono: string | null; avatar_url: string | null }> = {};
    if (activeUserIds.length > 0) {
      const { data: profiles } = await auth.supabase
        .from("user_profiles")
        .select("user_id, nombre, apellido, telefono, avatar_url")
        .in("user_id", activeUserIds);

      if (profiles) {
        profileMap = Object.fromEntries(
          profiles.map((p: { user_id: string; nombre: string; apellido: string; telefono: string | null; avatar_url: string | null }) => [p.user_id, p])
        );
      }
    }

    const enriched = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      profile: c.colaborador_user_id ? profileMap[c.colaborador_user_id as string] || null : null,
    }));

    return NextResponse.json(enriched);
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
    const { email, nombre, rol } = body;
    const validRol = rol === "director" ? "director" : "asesor";

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
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
    // Use perPage: 1000 to avoid missing users beyond the default 50-user page
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });
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
      // Ensure user_profiles row exists before invite (trigger may fail)
      // inviteUserByEmail creates auth.users row → trigger creates profile
      // If trigger fails, GoTrue returns "Database error saving new user"

      // Send invitation email via Supabase
      const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        email,
        { redirectTo: `${appUrl}/auth/callback?redirect=/proyectos` }
      );
      if (inviteError) {
        const msg = inviteError.message?.toLowerCase() || "";
        if (msg.includes("already") || msg.includes("exist") || msg.includes("duplicate")) {
          // User exists but wasn't found in listUsers — set as pendiente
          estado = "pendiente";
        } else if (msg.includes("database error")) {
          // Trigger failure — log and return clear error
          console.error("[collab] inviteUserByEmail trigger error:", inviteError.message);
          return NextResponse.json(
            { error: "Error al crear usuario. Intenta de nuevo." },
            { status: 500 }
          );
        } else {
          throw inviteError;
        }
      }

      // If invite succeeded, ensure user_profiles row exists
      // Keep colaboradorUserId = null so linkPendingCollaborator() can activate
      // the record when the invited user accepts and logs in
      if (inviteData?.user) {
        try {
          await supabaseAdmin.from("user_profiles").upsert({
            user_id: inviteData.user.id,
            nombre: nombre || "",
            apellido: "",
          }, { onConflict: "user_id" });
        } catch {
          // Non-critical — trigger may have already created the profile
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
        rol: validRol,
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
      // Log detailed error for debugging
      console.error("[collab] insert error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    // Send invite email (non-blocking, admin's locale, role-specific)
    const adminLocale = await getUserLocale(auth.supabase, auth.user.id);
    sendCollaboratorInvite({
      email: email.toLowerCase(),
      inviterName: auth.user.email || "Un administrador",
      rol: validRol,
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
