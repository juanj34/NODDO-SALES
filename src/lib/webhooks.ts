import { createAdminClient } from "@/lib/supabase/admin";
import type { WebhookConfig, WebhookEventType } from "@/types";

/* ── Payload shape sent to external URLs ── */

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  proyecto_id: string;
  proyecto_nombre: string;
  data: Record<string, unknown>;
}

/* ── HMAC-SHA256 signature ── */

async function sign(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Fire-and-forget dispatcher ── */

export function dispatchWebhook(
  projectId: string,
  config: WebhookConfig,
  payload: WebhookPayload,
): void {
  // Don't await — fire and forget
  dispatchInternal(projectId, config, payload).catch((err) => {
    console.error("[webhooks] Dispatch error:", err);
  });
}

async function dispatchInternal(
  projectId: string,
  config: WebhookConfig,
  payload: WebhookPayload,
): Promise<void> {
  const supabase = createAdminClient();
  const body = JSON.stringify(payload);
  const signature = await sign(body, config.secret);

  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let error: string | null = null;
  let delivered = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "User-Agent": "NODDO-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = res.status;
    delivered = res.ok;

    const text = await res.text();
    responseBody = text.slice(0, 2000);

    if (!res.ok) {
      error = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      error = err.name === "AbortError" ? "Timeout (5s)" : err.message;
    } else {
      error = "Unknown error";
    }
  }

  // Log delivery result
  await supabase.from("webhook_logs").insert({
    proyecto_id: projectId,
    event_type: payload.event,
    url: config.url,
    payload: payload as unknown as Record<string, unknown>,
    status_code: statusCode,
    response_body: responseBody,
    error,
    delivered,
  });
}

/* ── Helpers ── */

/** Fetch webhook config for a project, return null if not configured/enabled */
export async function getWebhookConfig(
  projectId: string,
  eventType: WebhookEventType,
): Promise<{ config: WebhookConfig; projectName: string } | null> {
  const supabase = createAdminClient();

  const { data: proyecto } = await supabase
    .from("proyectos")
    .select("nombre, webhook_config")
    .eq("id", projectId)
    .single();

  if (!proyecto?.webhook_config) return null;

  const config = proyecto.webhook_config as WebhookConfig;
  if (!config.enabled || !config.events.includes(eventType)) return null;

  return { config, projectName: proyecto.nombre };
}

/** Generate a cryptographically secure webhook secret (32 bytes hex) */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
