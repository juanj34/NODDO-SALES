/**
 * Role-based permission system for NODDO.
 * 4 roles: admin > administrador > director > asesor
 *
 * Admin = project owner (implicit, not in colaboradores table)
 * Administrador = near-full access collaborator (everything except project.delete + billing)
 * Director = senior agent, can manage content, leads, inventory
 * Asesor = junior agent, limited to leads (assigned), availability, cotizador
 */

import type { UserRole } from "@/types";

const ROLE_LEVEL: Record<UserRole, number> = {
  admin: 4,
  administrador: 3,
  director: 2,
  asesor: 1,
};

export type Permission =
  // Project-level
  | "project.create"
  | "project.update"
  | "project.delete"
  | "project.publish"
  | "project.clone"
  | "project.read"
  // Content editing (tipologias, galeria, videos, fachadas, planos, etc.)
  | "content.write"
  | "content.read"
  // Inventory (unidades)
  | "inventory.write"
  | "inventory.estado"
  | "inventory.read"
  // Leads
  | "leads.write"
  | "leads.assign"
  | "leads.read"
  // Cotizaciones
  | "cotizaciones.create"
  | "cotizaciones.delete"
  | "cotizaciones.read"
  // Tools
  | "tools.disponibilidad"
  | "tools.cotizador"
  // Analytics & reporting
  | "analytics.read"
  | "financiero.read"
  | "bitacora.read"
  | "bitacora.read_own"
  // Configuration
  | "config.write"
  // Team management
  | "team.manage"
  // Account
  | "account.billing"
  | "account.profile"
  // Upload
  | "upload.files"
  // AI features
  | "ai.use";

const PERMISSION_MIN_ROLE: Record<Permission, UserRole> = {
  "project.create": "administrador",
  "project.update": "administrador",
  "project.delete": "admin",
  "project.publish": "director",
  "project.clone": "administrador",
  "project.read": "asesor",
  "content.write": "director",
  "content.read": "asesor",
  "inventory.write": "director",
  "inventory.estado": "asesor",
  "inventory.read": "asesor",
  "leads.write": "director",
  "leads.assign": "director",
  "leads.read": "asesor",
  "cotizaciones.create": "asesor",
  "cotizaciones.delete": "director",
  "cotizaciones.read": "asesor",
  "tools.disponibilidad": "asesor",
  "tools.cotizador": "asesor",
  "analytics.read": "director",
  "financiero.read": "administrador",
  "bitacora.read": "director",
  "bitacora.read_own": "asesor",
  "config.write": "administrador",
  "team.manage": "administrador",
  "account.billing": "admin",
  "account.profile": "asesor",
  "upload.files": "asesor",
  "ai.use": "director",
};

/** Check if a role has a specific permission. */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const required = PERMISSION_MIN_ROLE[permission];
  return ROLE_LEVEL[role] >= ROLE_LEVEL[required];
}

/** Check if a role meets or exceeds a minimum role level. */
export function isAtLeast(role: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minRole];
}

/** Returns true if the user is any collaborator (not admin). */
export function isCollaborator(role: UserRole): boolean {
  return role !== "admin";
}

/** Role display labels (Spanish). */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Propietario",
  administrador: "Administrador",
  director: "Director",
  asesor: "Asesor",
};

/** Short role descriptions for invite modal. */
export const ROLE_DESCRIPTIONS: Record<"administrador" | "director" | "asesor", string> = {
  administrador: "Acceso total excepto eliminar proyectos y facturación",
  director: "Gestiona contenido, leads e inventario de los proyectos asignados",
  asesor: "Acceso a disponibilidad, NodDo Quote y leads asignados",
};
