import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types";
import { hasPermission, type Permission } from "@/lib/permissions";

/**
 * Service-role client for collaborator linking. RLS on `colaboradores` only
 * grants access to the admin or an ALREADY-linked collaborator, so a freshly
 * invited user's session can never see (or activate) their own pending row.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is not configured (previews).
 */
function tryCreateAdminClient(): SupabaseClient | null {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}

export type { UserRole };

export interface UserProfile {
  nombre: string;
  apellido: string;
  telefono: string | null;
  avatar_url: string | null;
}

export interface AuthContext {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  role: UserRole;
  adminUserId: string;
  isPlatformAdmin: boolean;
  profile: UserProfile | null;
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

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (err) {
    // Corrupted JWT in cookies — treat as unauthenticated (Node 24 strict header validation)
    if (err instanceof TypeError && (err as NodeJS.ErrnoException).code === "ERR_INVALID_CHAR") {
      return null;
    }
    throw err;
  }

  if (!user || !user.email) return null;

  // Check if this user is an active collaborator (now fetching rol)
  let { data: collab } = await supabase
    .from("colaboradores")
    .select("id, admin_user_id, rol, estado")
    .eq("colaborador_user_id", user.id)
    .in("estado", ["activo", "pendiente"])
    .limit(1)
    .maybeSingle();

  // Auto-activate pending collaborators who already have a session
  // (covers cases where linkPendingCollaborator wasn't triggered in /auth/callback).
  // Must run with service role: RLS only lets the ADMIN update colaboradores rows.
  if (collab && collab.estado === "pendiente") {
    const admin = tryCreateAdminClient();
    if (admin) {
      await admin
        .from("colaboradores")
        .update({ estado: "activo", activated_at: new Date().toISOString() })
        .eq("id", collab.id);
    }
    collab = { ...collab, estado: "activo" };
  }

  // Also check by email if no collab found by user_id (invitation with null
  // colaborador_user_id). The pending row is invisible to this user under RLS
  // (they are neither the admin nor linked yet), so both the lookup and the
  // linking need the service-role client. user.email comes from a verified
  // session (supabase.auth.getUser), so matching by it is safe.
  if (!collab && user.email) {
    const admin = tryCreateAdminClient();
    if (admin) {
      const { data: pendingByEmail } = await admin
        .from("colaboradores")
        .select("id, admin_user_id, rol, estado")
        .eq("email", user.email.toLowerCase())
        .eq("estado", "pendiente")
        .limit(1)
        .maybeSingle();

      if (pendingByEmail) {
        await admin
          .from("colaboradores")
          .update({
            colaborador_user_id: user.id,
            estado: "activo",
            activated_at: new Date().toISOString(),
          })
          .eq("id", pendingByEmail.id);
        collab = { ...pendingByEmail, estado: "activo" };
      }
    }
  }

  // Check if this user is a platform admin
  const { data: platformAdmin } = await supabase
    .from("platform_admins")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // Fetch user profile (if exists)
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("nombre, apellido, telefono, avatar_url")
    .eq("user_id", user.id)
    .maybeSingle();

  const profile: UserProfile | null = profileRow
    ? { nombre: profileRow.nombre, apellido: profileRow.apellido, telefono: profileRow.telefono, avatar_url: profileRow.avatar_url }
    : null;

  if (collab) {
    return {
      user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
      role: (collab.rol as "administrador" | "director" | "asesor") || "asesor",
      adminUserId: collab.admin_user_id,
      isPlatformAdmin: !!platformAdmin,
      profile,
      supabase,
    };
  }

  return {
    user: { id: user.id, email: user.email, user_metadata: user.user_metadata },
    role: "admin",
    adminUserId: user.id,
    isPlatformAdmin: !!platformAdmin,
    profile,
    supabase,
  };
}

/**
 * Guard helper for API routes. Returns 403 response if role lacks permission.
 * Usage: const denied = requirePermission(auth, "content.write"); if (denied) return denied;
 */
export function requirePermission(
  auth: AuthContext,
  permission: Permission
): NextResponse | null {
  if (!hasPermission(auth.role, permission)) {
    return NextResponse.json(
      { error: "No tienes permisos para esta acción" },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Returns the list of project IDs a user can access, or null if they can
 * access ALL projects (admin, or collaborator with no specific assignments).
 * Collaborators with explicit project assignments are scoped to those projects.
 */
export async function getAccessibleProjectIds(
  auth: AuthContext
): Promise<string[] | null> {
  if (auth.role === "admin" || auth.role === "administrador") return null;

  const { data: collab } = await auth.supabase
    .from("colaboradores")
    .select("id")
    .eq("colaborador_user_id", auth.user.id)
    .maybeSingle();
  if (!collab) return null; // not a collaborator record — fall back to admin-scoped queries

  const { data: assigned } = await auth.supabase
    .from("colaborador_proyectos")
    .select("proyecto_id")
    .eq("colaborador_id", collab.id);

  if (!assigned || assigned.length === 0) return null; // backward compat: no assignments = all
  return assigned.map((r: { proyecto_id: string }) => r.proyecto_id);
}

/**
 * Verifies that a project belongs to the authenticated user's admin account.
 * Works for both admins (own projects) and collaborators (admin's projects).
 */
export async function verifyProjectOwnership(
  auth: AuthContext,
  projectId: string
): Promise<boolean> {
  const { data } = await auth.supabase
    .from("proyectos")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", auth.adminUserId)
    .maybeSingle();
  return !!data;
}

/**
 * After login/signup, checks if this user's email has a pending collaborator
 * invitation and links them automatically. Returns true if a pending
 * invitation was linked (the caller can use this to route onboarding).
 *
 * Runs with the service-role client: the pending row (colaborador_user_id
 * still null) is invisible to the new user's session under RLS, which is why
 * invited users used to fall through to an empty "admin" dashboard.
 * The email is trusted because it comes from the verified auth session.
 */
export async function linkPendingCollaborator(
  user: { id: string; email?: string }
): Promise<boolean> {
  if (!user.email) return false;

  const admin = tryCreateAdminClient();
  if (!admin) return false;

  // Fetch pending record before update (to get rol for welcome email)
  // Match by email OR by colaborador_user_id — covers both cases:
  // 1. Invited user who hasn't been linked yet (colaborador_user_id is null)
  // 2. Invited user whose ID was set during invite (colaborador_user_id is already set)
  const { data: pending } = await admin
    .from("colaboradores")
    .select("id, rol")
    .eq("estado", "pendiente")
    .or(`email.eq.${user.email.toLowerCase()},colaborador_user_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();

  if (!pending) return false;

  await admin
    .from("colaboradores")
    .update({
      colaborador_user_id: user.id,
      estado: "activo",
      activated_at: new Date().toISOString(),
    })
    .eq("id", pending.id);

  // Send role-specific welcome email (fire-and-forget)
  try {
    const { sendCollaboratorWelcome } = await import("@/lib/email");
    sendCollaboratorWelcome({
      email: user.email,
      rol: (pending.rol as "administrador" | "director" | "asesor") || "asesor",
    }).catch((err) => console.error("[collab] welcome email error:", err));
  } catch {
    // Email module not available — skip silently
  }

  return true;
}
