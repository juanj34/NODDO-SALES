import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Centralized API error reporter for NODDO
 *
 * Reports errors to:
 * 1. Sentry — with user/project tags for filtering
 * 2. Supabase — error_logs table for admin panel visibility
 * 3. Resend — email notification for critical/500 errors
 *
 * Fire-and-forget: never throws, never breaks the API response.
 */

/* ── Lazy Resend init ────────────────────────────────────────────────── */

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

/* ── Types ───────────────────────────────────────────────────────────── */

export type ErrorSeverity = "warning" | "error" | "critical";

export interface ErrorContext {
  /** API route path, e.g. "/api/media/presign" */
  route: string;
  /** HTTP method */
  method?: string;
  /** HTTP status code returned */
  statusCode?: number;
  /** Authenticated user info (from getAuthContext) */
  user?: {
    id: string;
    email: string;
    role?: string;
  } | null;
  /** Project context if available */
  project?: {
    id: string;
    name?: string;
  } | null;
  /** IP address from request headers */
  ip?: string | null;
  /** User-Agent */
  userAgent?: string | null;
  /** Any extra data worth logging */
  metadata?: Record<string, unknown>;
}

/* ── Throttling (prevent email spam) ─────────────────────────────────── */

const emailThrottle = new Map<string, number>();
const THROTTLE_MS = 10 * 60 * 1000; // 10 minutes per fingerprint

function shouldThrottleEmail(fingerprint: string): boolean {
  const last = emailThrottle.get(fingerprint);
  if (last && Date.now() - last < THROTTLE_MS) return true;
  emailThrottle.set(fingerprint, Date.now());
  // Cleanup
  if (emailThrottle.size > 500) {
    const now = Date.now();
    for (const [k, v] of emailThrottle.entries()) {
      if (now - v > THROTTLE_MS) emailThrottle.delete(k);
    }
  }
  return false;
}

/* ── Fingerprint (group similar errors) ──────────────────────────────── */

function computeFingerprint(err: unknown, ctx: ErrorContext): string {
  const msg = err instanceof Error ? err.message : String(err);
  // Strip dynamic parts: UUIDs, timestamps, numbers
  const normalized = msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\d{13,}/g, "<ts>")
    .replace(/\d+/g, "<n>")
    .slice(0, 200);
  return `${ctx.route}:${normalized}`;
}

/* ── Severity classification ─────────────────────────────────────────── */

function classifySeverity(statusCode: number, err: unknown): ErrorSeverity {
  if (statusCode >= 500) return "critical";
  if (statusCode === 429) return "warning";
  if (statusCode === 403 || statusCode === 401) return "warning";
  if (err instanceof TypeError) return "error";
  return "error";
}

/* ── Main reporter ───────────────────────────────────────────────────── */

/**
 * Report an API error with full context.
 *
 * Call this in your API route catch blocks:
 * ```ts
 * catch (err) {
 *   await reportApiError(err, { route: "/api/media/presign", user: auth?.user });
 *   return NextResponse.json({ error: "..." }, { status: 500 });
 * }
 * ```
 */
export async function reportApiError(
  err: unknown,
  ctx: ErrorContext
): Promise<void> {
  try {
    const statusCode = ctx.statusCode ?? 500;
    const severity = classifySeverity(statusCode, err);
    const fingerprint = computeFingerprint(err, ctx);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    const errorCode =
      err instanceof Error ? (err as NodeJS.ErrnoException).code : undefined;

    // Run all three in parallel, never let any one block or break
    await Promise.allSettled([
      reportToSentry(err, ctx, severity, fingerprint),
      reportToDatabase(message, stack, errorCode, ctx, severity, fingerprint),
      maybeNotifyByEmail(message, ctx, severity, fingerprint),
    ]);
  } catch {
    // Absolute last resort — reporter itself must never throw
    console.error("[error-reporter] Reporter itself failed");
  }
}

/* ── Sentry ──────────────────────────────────────────────────────────── */

async function reportToSentry(
  err: unknown,
  ctx: ErrorContext,
  severity: ErrorSeverity,
  fingerprint: string
): Promise<void> {
  Sentry.withScope((scope) => {
    scope.setLevel(severity === "critical" ? "fatal" : severity);
    scope.setTag("route", ctx.route);
    scope.setTag("method", ctx.method ?? "POST");
    scope.setTag("statusCode", String(ctx.statusCode ?? 500));
    scope.setTag("severity", severity);
    scope.setFingerprint([fingerprint]);

    if (ctx.user) {
      scope.setUser({
        id: ctx.user.id,
        email: ctx.user.email,
      });
      scope.setTag("userRole", ctx.user.role ?? "unknown");
    }

    if (ctx.project) {
      scope.setTag("projectId", ctx.project.id);
      if (ctx.project.name) scope.setTag("projectName", ctx.project.name);
    }

    if (ctx.metadata) {
      scope.setContext("metadata", ctx.metadata);
    }

    Sentry.captureException(err instanceof Error ? err : new Error(String(err)));
  });
}

/* ── Database ────────────────────────────────────────────────────────── */

async function reportToDatabase(
  message: string,
  stack: string | undefined,
  errorCode: string | undefined,
  ctx: ErrorContext,
  severity: ErrorSeverity,
  fingerprint: string
): Promise<void> {
  const admin = createAdminClient();

  // Try to increment occurrence_count for an existing unresolved error
  // with the same fingerprint in the last 24h
  const { data: existing } = await admin
    .from("error_logs")
    .select("id, occurrence_count")
    .eq("fingerprint", fingerprint)
    .eq("resolved", false)
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await admin
      .from("error_logs")
      .update({
        occurrence_count: (existing.occurrence_count ?? 1) + 1,
        created_at: new Date().toISOString(),
        // Update user context to the latest occurrence
        ...(ctx.user ? { user_id: ctx.user.id, user_email: ctx.user.email, user_role: ctx.user.role } : {}),
      })
      .eq("id", existing.id);
    return;
  }

  // Insert new error log
  await admin.from("error_logs").insert({
    error_message: message.slice(0, 2000),
    error_stack: stack?.slice(0, 5000) ?? null,
    error_code: errorCode ?? null,
    route: ctx.route,
    method: ctx.method ?? "POST",
    status_code: ctx.statusCode ?? 500,
    user_id: ctx.user?.id ?? null,
    user_email: ctx.user?.email ?? null,
    user_role: ctx.user?.role ?? null,
    proyecto_id: ctx.project?.id ?? null,
    proyecto_nombre: ctx.project?.name ?? null,
    ip_address: ctx.ip ?? null,
    user_agent: ctx.userAgent?.slice(0, 500) ?? null,
    metadata: ctx.metadata ?? {},
    severity,
    fingerprint,
  });
}

/* ── Email notification ──────────────────────────────────────────────── */

async function maybeNotifyByEmail(
  message: string,
  ctx: ErrorContext,
  severity: ErrorSeverity,
  fingerprint: string
): Promise<void> {
  // Only email for critical errors (500s)
  if (severity !== "critical") return;
  if (shouldThrottleEmail(fingerprint)) return;

  const resend = getResend();
  if (!resend) return;

  const alertEmail =
    process.env.SECURITY_ALERT_EMAIL ||
    process.env.ADMIN_EMAIL ||
    "hola@noddo.io";

  const subject = `[ERROR] ${ctx.route} — ${message.slice(0, 80)}`;

  await resend.emails.send({
    from: "NODDO Errores <errores@noddo.io>",
    to: alertEmail,
    subject,
    html: buildErrorEmail(message, ctx, severity),
  });
}

/* ── Email template ──────────────────────────────────────────────────── */

function buildErrorEmail(
  message: string,
  ctx: ErrorContext,
  severity: ErrorSeverity
): string {
  const severityColors: Record<ErrorSeverity, string> = {
    warning: "#f59e0b",
    error: "#ef4444",
    critical: "#dc2626",
  };
  const color = severityColors[severity];
  const time = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

  const userInfo = ctx.user
    ? `<tr><td style="color:#888;padding:4px 12px 4px 0;">Usuario</td><td style="color:#f4f0e8;">${ctx.user.email} (${ctx.user.role ?? "unknown"})</td></tr>`
    : `<tr><td style="color:#888;padding:4px 12px 4px 0;">Usuario</td><td style="color:#f4f0e8;">No autenticado</td></tr>`;

  const projectInfo = ctx.project
    ? `<tr><td style="color:#888;padding:4px 12px 4px 0;">Proyecto</td><td style="color:#f4f0e8;">${ctx.project.name ?? ctx.project.id}</td></tr>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0b; color: #e5e5e5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1d; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
    <div style="background: ${color}; padding: 20px 24px;">
      <h1 style="margin: 0; color: white; font-size: 20px; font-weight: 700;">
        Error en API
      </h1>
      <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 13px; font-family: monospace;">
        ${ctx.method ?? "POST"} ${ctx.route} → ${ctx.statusCode ?? 500}
      </p>
    </div>

    <div style="padding: 24px;">
      <div style="background: #0a0a0b; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <p style="margin: 0; color: #ef4444; font-size: 14px; font-family: monospace; word-break: break-word;">
          ${escapeHtml(message)}
        </p>
      </div>

      <table style="font-size: 13px; border-collapse: collapse; width: 100%;">
        <tr><td style="color:#888;padding:4px 12px 4px 0;">Fecha</td><td style="color:#f4f0e8;">${time}</td></tr>
        <tr><td style="color:#888;padding:4px 12px 4px 0;">Ruta</td><td style="color:#f4f0e8; font-family: monospace;">${ctx.route}</td></tr>
        <tr><td style="color:#888;padding:4px 12px 4px 0;">Status</td><td style="color:#f4f0e8;">${ctx.statusCode ?? 500}</td></tr>
        ${userInfo}
        ${projectInfo}
      </table>

      <div style="margin-top: 20px; background: rgba(212,176,90,0.1); border-left: 3px solid #d4b05a; padding: 12px 16px; border-radius: 4px;">
        <p style="margin: 0; color: #d4b05a; font-size: 13px;">
          Revisa el panel de errores en <strong>/admin/errores</strong> para más detalles.
        </p>
      </div>
    </div>

    <div style="background: #0a0a0b; padding: 12px 24px; border-top: 1px solid #333;">
      <p style="margin: 0; color: #666; font-size: 11px; text-align: center;">
        NODDO Error Monitoring
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
