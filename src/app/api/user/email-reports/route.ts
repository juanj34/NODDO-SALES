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
    daily_digest_enabled: true,
    project_ids: null,
    email_override: null,
    timezone: "America/Bogota",
    last_weekly_sent: null,
    last_monthly_sent: null,
    last_daily_sent: null,
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
  const { weekly_enabled, monthly_enabled, daily_digest_enabled, project_ids, email_override, timezone } = body;

  const updateFields: Record<string, unknown> = {
    user_id: auth.user.id,
    updated_at: new Date().toISOString(),
  };
  if (weekly_enabled !== undefined) updateFields.weekly_enabled = weekly_enabled;
  if (monthly_enabled !== undefined) updateFields.monthly_enabled = monthly_enabled;
  if (daily_digest_enabled !== undefined) updateFields.daily_digest_enabled = daily_digest_enabled;
  if (project_ids !== undefined) updateFields.project_ids = project_ids;
  if (email_override !== undefined) updateFields.email_override = email_override;
  if (timezone !== undefined) updateFields.timezone = timezone;

  const { data, error } = await auth.supabase
    .from("email_report_config")
    .upsert(updateFields, { onConflict: "user_id" })
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
