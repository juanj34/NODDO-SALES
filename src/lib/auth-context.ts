import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type UserRole = "admin" | "colaborador";

export interface AuthContext {
  user: { id: string; email: string };
  role: UserRole;
  adminUserId: string;
  supabase: SupabaseClient;
}

/**
 * Central auth helper for API routes. Replaces raw `supabase.auth.getUser()`.
 * Returns null if not authenticated.
 * For collaborators, `adminUserId` points to the admin who invited them.
 * For admins, `adminUserId` is their own user ID.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) return null;

  // Check if this user is an active collaborator
  const { data: collab } = await supabase
    .from("colaboradores")
    .select("admin_user_id")
    .eq("colaborador_user_id", user.id)
    .eq("estado", "activo")
    .limit(1)
    .single();

  if (collab) {
    return {
      user: { id: user.id, email: user.email },
      role: "colaborador",
      adminUserId: collab.admin_user_id,
      supabase,
    };
  }

  return {
    user: { id: user.id, email: user.email },
    role: "admin",
    adminUserId: user.id,
    supabase,
  };
}

/**
 * After login/signup, checks if this user's email has a pending collaborator
 * invitation and links them automatically.
 */
export async function linkPendingCollaborator(
  supabase: SupabaseClient,
  user: { id: string; email?: string }
): Promise<void> {
  if (!user.email) return;

  await supabase
    .from("colaboradores")
    .update({
      colaborador_user_id: user.id,
      estado: "activo",
      activated_at: new Date().toISOString(),
    })
    .eq("email", user.email)
    .eq("estado", "pendiente")
    .is("colaborador_user_id", null);
}
