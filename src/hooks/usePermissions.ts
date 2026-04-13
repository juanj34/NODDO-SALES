"use client";

import { useMemo } from "react";
import { useAuthRole } from "./useAuthContext";
import { hasPermission, isAtLeast, isCollaborator, type Permission } from "@/lib/permissions";
import type { UserRole } from "@/types";

export function usePermissions() {
  const { role, loading } = useAuthRole();

  return useMemo(
    () => ({
      loading,
      role,
      can: (permission: Permission) =>
        role ? hasPermission(role, permission) : false,
      isAtLeast: (minRole: UserRole) =>
        role ? isAtLeast(role, minRole) : false,
      isAdmin: role === "admin",
      isAdministrador: role === "administrador",
      isDirector: role === "director",
      isAsesor: role === "asesor",
      isCollaborator: role ? isCollaborator(role) : false,
    }),
    [role, loading]
  );
}
