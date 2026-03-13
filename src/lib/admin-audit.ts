import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditAction, AuditTargetType } from "@/types";

interface AuditEntry {
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  details?: Record<string, unknown>;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_id: entry.adminId,
      admin_email: entry.adminEmail,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId,
      details: entry.details ?? {},
    });
  } catch {
    // Audit logging should never break the main operation
    console.error("[audit] Failed to log admin action:", entry.action);
  }
}
