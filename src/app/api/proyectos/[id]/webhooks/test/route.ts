import { getAuthContext } from "@/lib/auth-context";
import { dispatchWebhook } from "@/lib/webhooks";
import type { WebhookPayload } from "@/lib/webhooks";
import { NextRequest, NextResponse } from "next/server";
import type { WebhookConfig } from "@/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    if (auth.role !== "admin") return NextResponse.json({ error: "Solo administradores" }, { status: 403 });

    const { data: proyecto, error } = await auth.supabase
      .from("proyectos")
      .select("nombre, webhook_config")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .single();

    if (error || !proyecto) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

    const config = proyecto.webhook_config as WebhookConfig | null;
    if (!config?.enabled) {
      return NextResponse.json({ error: "Webhooks no configurados o deshabilitados" }, { status: 400 });
    }

    const testPayload: WebhookPayload = {
      event: "lead.created",
      timestamp: new Date().toISOString(),
      proyecto_id: id,
      proyecto_nombre: proyecto.nombre,
      data: {
        id: "test-" + crypto.randomUUID().slice(0, 8),
        nombre: "Lead de Prueba",
        email: "test@example.com",
        telefono: "+573001234567",
        pais: "Colombia",
        tipologia_interes: "Apartamento 2 Habitaciones",
        mensaje: "Este es un webhook de prueba desde NODDO",
        utm_source: "test",
        utm_medium: "webhook",
        utm_campaign: "test",
        status: "nuevo",
        created_at: new Date().toISOString(),
      },
    };

    dispatchWebhook(id, config, testPayload);

    return NextResponse.json({ success: true, message: "Webhook de prueba enviado" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 500 });
  }
}
