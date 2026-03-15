import { getAuthContext } from "@/lib/auth-context";
import { checkFeature } from "@/lib/feature-flags";
import { checkFeatureAccess, FEATURE_LABELS } from "@/lib/feature-access";
import { sendFeatureBlocked } from "@/lib/email";
import { generateWebhookSecret } from "@/lib/webhooks";
import { NextRequest, NextResponse } from "next/server";
import type { WebhookConfig, WebhookEventType } from "@/types";

const VALID_EVENTS: WebhookEventType[] = ["lead.created", "cotizacion.created"];

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Check plan-based access first
    const planAccess = await checkFeatureAccess(auth.supabase, auth.adminUserId, "webhooks");
    if (!planAccess.allowed) {
      // Send feature blocked email (fire-and-forget)
      if (auth.user.email && planAccess.requiredPlan) {
        sendFeatureBlocked({
          email: auth.user.email,
          name: auth.user.user_metadata?.full_name || auth.user.email.split("@")[0],
          feature: FEATURE_LABELS.webhooks,
          currentPlan: planAccess.currentPlan,
          requiredPlan: planAccess.requiredPlan,
        }).catch((err) => {
          console.error("[webhooks/GET] Failed to send feature blocked email:", err);
        });
      }

      return NextResponse.json(
        {
          error: `Webhooks requieren plan ${planAccess.requiredPlan}`,
          upgrade_required: true,
          current_plan: planAccess.currentPlan,
          required_plan: planAccess.requiredPlan,
        },
        { status: 403 }
      );
    }

    const { data: proyecto, error } = await auth.supabase
      .from("proyectos")
      .select("webhook_config")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !proyecto) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

    const config = proyecto.webhook_config as WebhookConfig | null;
    if (!config) return NextResponse.json(null);

    // Redact secret
    return NextResponse.json({
      ...config,
      secret: config.secret.slice(0, 8) + "••••••••••••••••",
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    // Check plan-based access first
    const planAccess = await checkFeatureAccess(auth.supabase, auth.adminUserId, "webhooks");
    if (!planAccess.allowed) {
      // Send feature blocked email (fire-and-forget)
      if (auth.user.email && planAccess.requiredPlan) {
        sendFeatureBlocked({
          email: auth.user.email,
          name: auth.user.user_metadata?.full_name || auth.user.email.split("@")[0],
          feature: FEATURE_LABELS.webhooks,
          currentPlan: planAccess.currentPlan,
          requiredPlan: planAccess.requiredPlan,
        }).catch((err) => {
          console.error("[webhooks/PUT] Failed to send feature blocked email:", err);
        });
      }

      return NextResponse.json(
        {
          error: `Webhooks requieren plan ${planAccess.requiredPlan}`,
          upgrade_required: true,
          current_plan: planAccess.currentPlan,
          required_plan: planAccess.requiredPlan,
        },
        { status: 403 }
      );
    }

    // Check feature flag
    const webhooksEnabled = await checkFeature(auth.supabase, id, "webhooks");
    if (!webhooksEnabled) {
      return NextResponse.json(
        { error: "Webhooks no están habilitados para este proyecto" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { enabled, url, events, regenerate_secret } = body;

    if (typeof enabled !== "boolean") {
      return NextResponse.json({ error: "enabled es requerido (boolean)" }, { status: 400 });
    }

    if (enabled) {
      if (!url || typeof url !== "string") {
        return NextResponse.json({ error: "url es requerida" }, { status: 400 });
      }
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "URL debe ser HTTP o HTTPS" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      }
      if (!Array.isArray(events) || events.length === 0) {
        return NextResponse.json({ error: "Selecciona al menos un evento" }, { status: 400 });
      }
      const invalidEvents = events.filter((e: string) => !VALID_EVENTS.includes(e as WebhookEventType));
      if (invalidEvents.length > 0) {
        return NextResponse.json({ error: `Eventos inválidos: ${invalidEvents.join(", ")}` }, { status: 400 });
      }
    }

    // Fetch existing config to preserve secret
    const { data: proyecto } = await auth.supabase
      .from("proyectos")
      .select("webhook_config")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (!proyecto) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

    const existing = proyecto.webhook_config as WebhookConfig | null;
    const isNewSetup = !existing?.secret;
    const needsNewSecret = isNewSetup || regenerate_secret === true;
    const secret = needsNewSecret ? generateWebhookSecret() : existing!.secret;

    const newConfig: WebhookConfig = {
      enabled,
      url: url?.trim() || "",
      secret,
      events: events || [],
    };

    const { error } = await auth.supabase
      .from("proyectos")
      .update({ webhook_config: newConfig, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;

    return NextResponse.json({
      ...newConfig,
      secret: needsNewSecret ? secret : secret.slice(0, 8) + "••••••••••••••••",
      _secret_revealed: needsNewSecret,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { error } = await auth.supabase
      .from("proyectos")
      .update({ webhook_config: null, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
