import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationType = "lead.new" | "project.published" | "cotizacion.sent";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  titleEn?: string;
  body?: string;
  bodyEn?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Fire-and-forget notification insert using service role.
 * Safe to call without awaiting — logs errors but never throws.
 */
export function createNotification(params: CreateNotificationParams): void {
  const supabase = createAdminClient();

  supabase
    .from("notifications")
    .insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      title_en: params.titleEn,
      body: params.body,
      body_en: params.bodyEn,
      metadata: params.metadata ?? {},
    })
    .then(({ error }) => {
      if (error) {
        console.error("[Notifications] Insert failed:", error.message);
      }
    });
}
