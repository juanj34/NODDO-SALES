import { getAuthContext } from "@/lib/auth-context";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/email-reports
 * Obtiene la configuración de reportes por email del usuario autenticado
 */
export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from("email_report_config")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Retornar defaults si no existe configuración
  return NextResponse.json(data || {
    weekly_enabled: true,
    monthly_enabled: true,
    project_ids: null,
    email_override: null,
    timezone: "America/Bogota",
    last_weekly_sent: null,
    last_monthly_sent: null,
  });
}

/**
 * PUT /api/user/email-reports
 * Actualiza la configuración de reportes por email del usuario autenticado
 */
export async function PUT(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { weekly_enabled, monthly_enabled, project_ids, email_override, timezone } = body;

  const { data, error } = await auth.supabase
    .from("email_report_config")
    .upsert({
      user_id: auth.user.id,
      weekly_enabled,
      monthly_enabled,
      project_ids,
      email_override,
      timezone,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
