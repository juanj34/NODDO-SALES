import { Resend } from "resend";

/**
 * Security alerting system for NODDO platform
 * Sends email notifications for suspicious activity
 */

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export type SecurityAlertType =
  | "rate_limit_exceeded"
  | "login_failure_spike"
  | "webhook_failure_spike"
  | "suspicious_activity"
  | "database_error_spike"
  | "unauthorized_access_attempt";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityAlertParams {
  type: SecurityAlertType;
  severity: SecuritySeverity;
  details: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Send security alert via email
 *
 * Uses Resend API to send formatted security notifications
 * Falls back to console.error if email is not configured
 */
export async function sendSecurityAlert(params: SecurityAlertParams): Promise<void> {
  const {
    type,
    severity,
    details,
    timestamp = new Date().toISOString(),
  } = params;

  const alertEmail = process.env.SECURITY_ALERT_EMAIL || process.env.ADMIN_EMAIL || "hola@noddo.io";

  // Build email content
  const subject = `[SECURITY ${severity.toUpperCase()}] ${formatAlertType(type)}`;
  const body = buildAlertEmailBody(type, severity, details, timestamp);

  // If Resend is not configured, log to console
  if (!resend) {
    console.error(`[SECURITY ALERT] ${subject}`);
    console.error(JSON.stringify(details, null, 2));
    return;
  }

  try {
    await resend.emails.send({
      from: "NODDO Security <seguridad@noddo.io>",
      to: alertEmail,
      subject,
      html: body,
    });

    console.warn(`[security-alert] Sent ${severity} alert: ${type}`);
  } catch (err) {
    console.error("[security-alert] Failed to send email:", err);
    console.error(`[SECURITY ALERT] ${subject}`);
    console.error(JSON.stringify(details, null, 2));
  }
}

/**
 * Format alert type for human readability
 */
function formatAlertType(type: SecurityAlertType): string {
  const typeMap: Record<SecurityAlertType, string> = {
    rate_limit_exceeded: "Rate Limit Exceeded",
    login_failure_spike: "Login Failure Spike Detected",
    webhook_failure_spike: "Webhook Failure Spike",
    suspicious_activity: "Suspicious Activity Detected",
    database_error_spike: "Database Error Spike",
    unauthorized_access_attempt: "Unauthorized Access Attempt",
  };
  return typeMap[type] || type;
}

/**
 * Build HTML email body for security alert
 */
function buildAlertEmailBody(
  type: SecurityAlertType,
  severity: SecuritySeverity,
  details: Record<string, unknown>,
  timestamp: string
): string {
  const severityColors: Record<SecuritySeverity, string> = {
    low: "#3b82f6",      // blue
    medium: "#f59e0b",   // amber
    high: "#ef4444",     // red
    critical: "#dc2626", // dark red
  };

  const color = severityColors[severity];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0b; color: #e5e5e5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #1a1a1d; border-radius: 12px; overflow: hidden; border: 1px solid #333;">
    <!-- Header -->
    <div style="background: ${color}; padding: 24px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700;">
        🚨 Security Alert
      </h1>
      <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
        ${severity} Severity
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 24px;">
      <h2 style="margin: 0 0 16px; color: #f4f0e8; font-size: 20px;">
        ${formatAlertType(type)}
      </h2>

      <p style="margin: 0 0 24px; color: #a8a8a8; font-size: 14px;">
        Detected at: <strong style="color: #f4f0e8;">${new Date(timestamp).toLocaleString()}</strong>
      </p>

      <div style="background: #0a0a0b; border: 1px solid #333; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; color: #d4b05a; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          Alert Details
        </h3>
        <pre style="margin: 0; font-family: 'Courier New', monospace; font-size: 12px; color: #e5e5e5; white-space: pre-wrap; word-break: break-word;">${JSON.stringify(details, null, 2)}</pre>
      </div>

      <div style="background: rgba(212, 176, 90, 0.1); border-left: 3px solid #d4b05a; padding: 12px 16px; border-radius: 4px;">
        <p style="margin: 0; color: #d4b05a; font-size: 13px;">
          <strong>Action Required:</strong> Please review this alert and take appropriate action if necessary.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #0a0a0b; padding: 16px 24px; border-top: 1px solid #333;">
      <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
        NODDO Platform Security Monitoring
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Check if alert should be throttled (prevent spam)
 *
 * Uses in-memory cache with TTL
 * In production, consider using Redis for distributed throttling
 */
const alertCache = new Map<string, number>();
const THROTTLE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function shouldThrottleAlert(type: SecurityAlertType, key: string): boolean {
  const cacheKey = `${type}:${key}`;
  const lastSent = alertCache.get(cacheKey);

  if (lastSent && Date.now() - lastSent < THROTTLE_WINDOW_MS) {
    return true; // Throttle
  }

  alertCache.set(cacheKey, Date.now());

  // Clean up old entries
  if (alertCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of alertCache.entries()) {
      if (now - v > THROTTLE_WINDOW_MS) {
        alertCache.delete(k);
      }
    }
  }

  return false;
}
