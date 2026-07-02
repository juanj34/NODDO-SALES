import { getAuthContext, requirePermission } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCollaboratorInvite, getUserLocale } from "@/lib/email";
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
    const denied = requirePermission(auth, "team.manage");
    if (denied) return denied;

    // Verify collaborator belongs to this admin and is pending
    const { data: colab, error } = await auth.supabase
      .from("colaboradores")
      .select("id, email, estado, rol")
      .eq("id", id)
      .eq("admin_user_id", auth.adminUserId)
      .single();

    if (error || !colab) {
      return NextResponse.json({ error: "Colaborador no encontrado" }, { status: 404 });
    }

    if (colab.estado !== "pendiente") {
      return NextResponse.json({ error: "Solo se puede reenviar a invitaciones pendientes" }, { status: 400 });
    }

    // Regenerate a fresh tokened link for the branded email.
    // "invite" works for not-yet-confirmed users; if the user already
    // confirmed (e.g. signed in with Google), fall back to a magic link.
    const supabaseAdmin = createAdminClient();
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";
    let inviteUrl = `${appUrl}/login?redirect=/proyectos`;

    const { data: inviteLink, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: colab.email,
      options: { redirectTo: `${appUrl}/auth/callback?redirect=/invitacion` },
    });

    let hashedToken = inviteLink?.properties?.hashed_token;
    let linkType: "invite" | "magiclink" = "invite";

    if (inviteError || !hashedToken) {
      const { data: magicLink } = await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: colab.email,
        options: { redirectTo: `${appUrl}/auth/callback?redirect=/invitacion` },
      });
      hashedToken = magicLink?.properties?.hashed_token;
      linkType = "magiclink";
    }

    if (hashedToken) {
      inviteUrl = `${appUrl}/auth/confirm?token_hash=${encodeURIComponent(hashedToken)}&type=${linkType}&next=/invitacion`;
    }

    const adminLocale = await getUserLocale(auth.supabase, auth.user.id);
    const emailSent = await sendCollaboratorInvite({
      email: colab.email,
      inviterName: auth.user.email || "Un administrador",
      rol: (colab.rol as "administrador" | "director" | "asesor") || "asesor",
      locale: adminLocale,
      inviteUrl,
    });

    if (!emailSent) {
      return NextResponse.json(
        { error: "No se pudo enviar el correo. Intenta de nuevo." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 500 }
    );
  }
}
