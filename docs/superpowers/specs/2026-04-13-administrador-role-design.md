# Rol "Administrador" para Colaboradores

**Date:** 2026-04-13
**Status:** Draft

## Summary

Add a new collaborator role `"administrador"` that grants near-full access — everything the account owner (`admin`) can do, **except** delete projects and manage billing/plan.

## Current State

### Role Hierarchy
```
admin (3) > director (2) > asesor (1)
```

- `admin` = account owner (implicit, not stored in `colaboradores`)
- `director` / `asesor` = stored in `colaboradores.rol`

### Key Restrictions
- `project.create`, `project.update`, `project.delete`, `project.clone` = admin only
- `config.write`, `team.manage`, `account.billing`, `financiero.read` = admin only
- Collaborator management UI (`/equipo`) blocks non-admin roles

## Proposed Design

### New Role Hierarchy
```
admin (4) > administrador (3) > director (2) > asesor (1)
```

### Permission Changes

The `administrador` gets everything `admin` has **except** two permissions:

| Permission | Before (min role) | After (min role) |
|---|---|---|
| `project.create` | admin | administrador |
| `project.update` | admin | administrador |
| `project.delete` | admin | **stays admin** |
| `project.publish` | director | director (no change) |
| `project.clone` | admin | administrador |
| `project.read` | asesor | asesor (no change) |
| `config.write` | admin | administrador |
| `team.manage` | admin | administrador |
| `account.billing` | admin | **stays admin** |
| `financiero.read` | admin | administrador |
| All other permissions | director or asesor | no change (inherited) |

### Database Changes

**Migration:** ALTER the CHECK constraint on `colaboradores.rol` to include `'administrador'`.

```sql
ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_rol_check;

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_rol_check
  CHECK (rol IN ('administrador', 'director', 'asesor'));
```

No new tables or columns needed.

### File Changes

#### 1. `src/types/index.ts`

```typescript
// Before
export type UserRole = "admin" | "director" | "asesor";
export interface Colaborador {
  // ...
  rol: "director" | "asesor";
}

// After
export type UserRole = "admin" | "administrador" | "director" | "asesor";
export interface Colaborador {
  // ...
  rol: "administrador" | "director" | "asesor";
}
```

#### 2. `src/lib/permissions.ts`

- Update `ROLE_LEVEL`: add `administrador: 3`, bump `admin` to `4`
- Update `PERMISSION_MIN_ROLE`:
  - `project.create` → `"administrador"`
  - `project.update` → `"administrador"`
  - `project.clone` → `"administrador"`
  - `config.write` → `"administrador"`
  - `team.manage` → `"administrador"`
  - `financiero.read` → `"administrador"`
  - `project.delete` stays `"admin"`
  - `account.billing` stays `"admin"`
- Update `ROLE_LABELS`: add `administrador: "Administrador"`, rename `admin` to `"Propietario"` (to distinguish from the new role)
- Update `ROLE_DESCRIPTIONS`: add `administrador` description
- Update `isCollaborator()`: now returns `true` for `administrador` too (it already does since `role !== "admin"`)

#### 3. `src/lib/auth-context.ts`

- Line 116: cast `collab.rol` to include `"administrador"`:
  ```typescript
  role: (collab.rol as "administrador" | "director" | "asesor") || "asesor",
  ```
- Line 224: same update for welcome email rol type
- `getAccessibleProjectIds()`: `administrador` should return `null` (access all projects) just like `admin`. Current check is `auth.role === "admin"` — change to `auth.role === "admin" || auth.role === "administrador"` or use `isAtLeast(auth.role, "administrador")`.

#### 4. `src/app/(dashboard)/equipo/page.tsx`

- Change role gate from `role !== "admin"` to check `hasPermission(role, "team.manage")` instead of hardcoded role check
- Add `"administrador"` option to the invite role dropdown
- The `administrador` cannot invite another `administrador` (only the account owner can elevate to that level) — enforce in both UI and API

#### 5. API Routes — Collaborator Management

**`src/app/api/colaboradores/route.ts` (POST):**
- Change from `auth.role === "admin"` to `requirePermission(auth, "team.manage")`
- Validate: if `auth.role === "administrador"`, they can only create `director` or `asesor` collaborators, NOT `administrador`

**`src/app/api/colaboradores/[id]/route.ts` (PUT/DELETE):**
- Change from `auth.role === "admin"` to `requirePermission(auth, "team.manage")`
- PUT: if caller is `administrador`, prevent changing anyone's rol to `administrador`
- PUT: `administrador` cannot edit other `administrador` collaborators (only admin can)
- DELETE: `administrador` cannot delete other `administrador` collaborators

**`src/app/api/colaboradores/[id]/proyectos/route.ts`:**
- Change from `auth.role === "admin"` to `requirePermission(auth, "team.manage")`

**`src/app/api/colaboradores/[id]/reset-password/route.ts`:**
- Change from `auth.role === "admin"` to `requirePermission(auth, "team.manage")`

**`src/app/api/colaboradores/[id]/resend/route.ts`:**
- Change from `auth.role === "admin"` to `requirePermission(auth, "team.manage")`

#### 6. API Routes — Project Delete

**`src/app/api/proyectos/[id]/route.ts` (DELETE):**
- Verify it uses `requirePermission(auth, "project.delete")` — if it currently checks `auth.role === "admin"` directly, switch to the permission check. The permission matrix already restricts `project.delete` to `admin` only.

#### 7. Other API routes with hardcoded `auth.role === "admin"` checks

Search all API routes for `auth.role === "admin"` and evaluate each:
- If the check corresponds to a permission (e.g., `project.create`), switch to `requirePermission()`
- If the check is truly admin-only (billing), keep it

### Constraint: Administrador Cannot Self-Elevate

The `administrador` role has `team.manage` permission but with restrictions:
- Can create `director` and `asesor` collaborators
- Can edit/suspend/delete `director` and `asesor` collaborators
- **Cannot** create or promote anyone to `administrador` — only the account owner (`admin`) can
- **Cannot** edit or delete other `administrador` collaborators

This is enforced at the API level, not the permission level.

### UI Label Change

To avoid confusion between "Administrador" (collaborator role) and the account owner:
- `admin` role label: **"Propietario"** (account owner)
- `administrador` role label: **"Administrador"**
- `director` role label: stays "Director"
- `asesor` role label: stays "Asesor"

### What Does NOT Change

- **RLS policies**: `is_project_authorized()` doesn't check specific roles, just active collaborator status
- **Middleware**: No role-based routing for collaborators
- **Microsite pages**: Public, no auth
- **Database tables**: No new tables, just a CHECK constraint update
