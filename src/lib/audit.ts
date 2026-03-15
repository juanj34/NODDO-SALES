import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Audit logging helper for NODDO platform
 * Records all critical data changes for compliance and debugging
 *
 * Uses service role to bypass RLS (audit logs should be immutable)
 */

export interface AuditLogParams {
  userId: string;
  userEmail: string;
  action: "INSERT" | "UPDATE" | "DELETE";
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event
 *
 * IMPORTANT: This function NEVER throws. Audit logging should never break core functionality.
 * Errors are logged to console but swallowed.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("audit_logs").insert({
      user_id: params.userId,
      user_email: params.userEmail,
      action: params.action,
      table_name: params.tableName,
      record_id: params.recordId,
      old_data: params.oldData || null,
      new_data: params.newData || null,
      ip_address: params.ipAddress || null,
      user_agent: params.userAgent || null,
    });

    if (error) {
      console.error("[audit] Failed to log:", error);
    }
  } catch (err) {
    console.error("[audit] Exception while logging:", err);
    // Don't throw - audit logging should never break core functionality
  }
}

/**
 * Batch log multiple audit events
 * Useful for bulk operations
 */
export async function logAuditBatch(events: AuditLogParams[]): Promise<void> {
  try {
    const supabase = createAdminClient();

    const rows = events.map((e) => ({
      user_id: e.userId,
      user_email: e.userEmail,
      action: e.action,
      table_name: e.tableName,
      record_id: e.recordId,
      old_data: e.oldData || null,
      new_data: e.newData || null,
      ip_address: e.ipAddress || null,
      user_agent: e.userAgent || null,
    }));

    const { error } = await supabase.from("audit_logs").insert(rows);

    if (error) {
      console.error("[audit] Failed to batch log:", error);
    }
  } catch (err) {
    console.error("[audit] Exception while batch logging:", err);
  }
}

/**
 * Helper to sanitize data before logging (remove sensitive fields)
 */
export function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };

  // Remove sensitive fields that shouldn't be in audit logs
  const sensitiveFields = [
    "password",
    "password_hash",
    "token",
    "access_token",
    "refresh_token",
    "secret",
    "api_key",
    "private_key",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}
