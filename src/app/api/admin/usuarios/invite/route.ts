import { getAuthContext } from "@/lib/auth-context";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/admin-audit";
import { sendAdminUserInvite } from "@/lib/email";
import { PLAN_DEFAULTS, type PlanType } from "@/lib/plan-limits";
import { NextRequest, NextResponse } from "next/server";

const VALID_PLANS: PlanType[] = ["basico", "pro", "enterprise"];

export async function POST(request: NextRequest) {
  const auth = await getAuthContext();
  if (!auth || !auth.isPlatformAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { email, plan, nombre } = body as {
    email?: string;
    plan?: string;
    nombre?: string;
  };

  // Validate required fields
  if (!email || !plan) {
    return NextResponse.json(
      { error: "Email y plan son requeridos" },
      { status: 400 }
    );
  }

  if (!VALID_PLANS.includes(plan as PlanType)) {
    return NextResponse.json(
      { error: `Plan invalido. Opciones: ${VALID_PLANS.join(", ")}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Try to create user via invite (bypasses enable_signup = false)
  // If user already exists, Supabase will return an error — no need to pre-check
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://noddo.io";
  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl}/auth/callback?redirect=/dashboard`,
      data: nombre ? { full_name: nombre } : undefined,
    });

  if (inviteError) {
    // Supabase returns specific error if user already exists
    const msg = inviteError.message.toLowerCase();
    if (msg.includes("already") || msg.includes("exist") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "Ya existe un usuario con este email" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: inviteError.message || "Error al invitar usuario" },
      { status: 500 }
    );
  }

  if (!inviteData?.user) {
    return NextResponse.json(
      { error: "Error al invitar usuario" },
      { status: 500 }
    );
  }

  const userId = inviteData.user.id;
  const planDefaults = PLAN_DEFAULTS[plan as PlanType];

  // Create user_plans entry
  const { error: planError } = await admin.from("user_plans").insert({
    user_id: userId,
    plan,
    status: "active",
    max_projects: planDefaults.max_projects,
    max_units_per_project: planDefaults.max_units_per_project,
    started_at: new Date().toISOString(),
  });

  if (planError) {
    console.error("[invite] Failed to create user plan:", planError);
  }

  // Create user_profiles entry if nombre provided
  if (nombre) {
    const nameParts = nombre.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    await admin.from("user_profiles").upsert({
      user_id: userId,
      nombre: firstName,
      apellido: lastName || null,
    });
  }

  // Send branded NODDO invite email (non-blocking)
  sendAdminUserInvite({ email, plan }).catch((err) => {
    console.error("[invite] Failed to send branded invite email:", err);
  });

  // Audit log
  await logAdminAction({
    adminId: auth.user.id,
    adminEmail: auth.user.email ?? "",
    action: "user_invited",
    targetType: "user",
    targetId: userId,
    details: { email, plan, nombre: nombre || null },
  });

  return NextResponse.json({
    success: true,
    userId,
    email,
    plan,
  });
}
