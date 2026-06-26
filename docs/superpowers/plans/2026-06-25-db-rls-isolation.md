# Database RLS & Tenant-Isolation Policies Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This is a DATABASE plan: most "tests" are SQL assertions run against a Postgres connection, not vitest (the repo has no vitest — only Playwright e2e and `tsc`/`eslint` gates).

**Goal:** Close the verified gaps where NODDO's Row-Level-Security policies disagree with the application's role/permission model, so that every tenant role (admin, administrador, director, asesor) and the platform-admin allowlist behave identically at the DB layer and the API layer, with no silent write failures and no cross-tenant escalation path.

**Architecture:** Tenancy is keyed on `proyectos.user_id` (the owning "admin"); collaborators attach via `colaboradores.admin_user_id` and are gated by two `SECURITY DEFINER` helper functions — `is_project_authorized(project_user_id)` (owner OR any active collaborator) and `is_content_writer(project_user_id)` (owner OR active `director`). The application layer (`src/lib/permissions.ts` + `src/lib/auth-context.ts`) added an `administrador` role and per-project scoping (`colaborador_proyectos`) that the RLS helpers never caught up to. The fix is a set of additive, idempotent SQL migrations that (1) realign the helper functions and policies with the 4-role model, (2) replace ad-hoc `platform_admins` sub-selects with the canonical `is_platform_admin()` function, (3) correct the storage-quota plan-name drift, and (4) add a defense-in-depth helper for per-project collaborator scoping. Each migration is verified by SQL assertions (`pg_policies`, `pg_get_functiondef`, role-impersonation `SET LOCAL`) before commit. No application/source code is changed except where a migration's verification reveals a dead-code helper that should be re-pointed (called out as a DECISION GATE).

**Tech Stack:** Supabase Postgres 17, SQL RLS policies, `SECURITY DEFINER` PL/pgSQL + SQL helper functions, Supabase CLI (`supabase db push` via `npm run db:migrate`), `psql` for verification assertions.

---

## Conventions for every task in this plan

- **Branch:** All work on a `fix/<slug>` branch cut from `dev` (per WORKFLOW.md). NEVER commit to `main`. Create once at the start:
  ```bash
  git checkout dev && git pull && git checkout -b fix/db-rls-isolation
  ```
- **Migration file naming:** New migrations live in `supabase/migrations/` and MUST sort AFTER the current latest (`20260719000000_galeria_grupos.sql`). Use the timestamps assigned per task below.
- **Apply migrations:** `npm run db:migrate` (= `npx supabase db push`). This pushes all pending migrations to the linked Supabase project. Run it on a **non-production / preview** Supabase project first if one is linked; the owner gates production application (see global DECISION GATE below).
- **Verify gate before EVERY commit:**
  ```bash
  npm run typecheck && npm run lint
  ```
  (No vitest exists; SQL assertions are the functional gate for these DB tasks.)
- **`psql` connection:** Verification SQL assumes a `psql "$DATABASE_URL"` connection to the same database the migration was pushed to. If only the Supabase MCP is available, run the identical SQL via `mcp__supabase__execute_sql` after confirming the MCP points at the NODDO project (`project_id = "NODDO"` in `supabase/config.toml`), NOT another project.
- **Conventional commits:** prefix `fix:` for behavioral corrections, `chore:` for non-behavioral cleanup.

> **GLOBAL DECISION GATE — Production application of RLS migrations.**
> These migrations change live access control. Per WORKFLOW.md, production (`main` → `noddo.io`) must NEVER be pushed without explicit owner approval, and `npm run db:migrate` applies to the linked Supabase project directly (not gated by Vercel deploy).
> - **Branch A (preview/staging Supabase project exists):** push migrations there, run the SQL assertions and a manual collaborator-role smoke (invite an `administrador`, edit a tipología, publish), then schedule the production `db:migrate` with the owner.
> - **Branch B (single shared Supabase project):** STOP before `npm run db:migrate`. Present the migration SQL + assertions to the owner, get explicit go, then apply in a low-traffic window. All migrations in this plan are additive/idempotent (`DROP POLICY IF EXISTS` + `CREATE`, `CREATE OR REPLACE FUNCTION`) and safe to re-run, but they DO take effect immediately on the shared DB.

---

### Task 1: Fix `is_content_writer` to include the `administrador` role (CRITICAL — silent content-write failure)

**Root cause (verified):** `is_content_writer(project_user_id)` is defined exactly once, in `supabase/migrations/20260611000000_roles_permissions.sql:20-32`, and only authorizes `rol = 'director'`. The `administrador` role was added later in `supabase/migrations/20260717000000_administrador_role.sql` but the helper was never updated. `src/lib/permissions.ts:70` grants `content.write` to `director` (level 2) and above — so `administrador` (level 3) passes `requirePermission(auth, "content.write")` in routes like `src/app/api/tipologias/route.ts:11`, then the write executes through `auth.supabase` (the user's RLS-scoped client, `src/app/api/tipologias/route.ts:35`) and is **blocked by the `Content writer ...` RLS policies** because `is_content_writer` returns false for `administrador`. Net effect: an `administrador` collaborator gets 500s / silent failures on every content write (tipologías, galería, videos, fachadas, planos, recursos, torres, vistas_piso, complementos, galeria_grupos, unidades insert/delete).

**Files:**
- Create: `supabase/migrations/20260720000000_fix_is_content_writer_administrador.sql`
- Verify (assertions): inline SQL below (no app file changes)

- [ ] **Step 1: Write the verification assertion that currently FAILS**

Create a scratch assertion file `C:\Users\juanj\AppData\Local\Temp\claude\C--Users-juanj\48328299-b63a-4446-bc39-74849d4a9933\scratchpad\assert_content_writer.sql` with:

```sql
-- Expect: the function body must reference 'administrador'. FAILS before the migration.
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef('public.is_content_writer(uuid)'::regprocedure) INTO def;
  IF position('administrador' in def) = 0 THEN
    RAISE EXCEPTION 'FAIL: is_content_writer does not authorize administrador role. Body: %', def;
  END IF;
  RAISE NOTICE 'PASS: is_content_writer authorizes administrador';
END $$;
```

- [ ] **Step 2: Run the assertion — expect FAIL**

```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_content_writer.sql"
```
Expected output (before fix):
```
ERROR:  FAIL: is_content_writer does not authorize administrador role. Body: ...rol = 'director'...
```

- [ ] **Step 3: Write the migration (minimal implementation)**

Create `supabase/migrations/20260720000000_fix_is_content_writer_administrador.sql` with the exact content below. The body mirrors the original (PL/pgSQL, `SECURITY DEFINER STABLE`) and only widens the `rol` predicate:

```sql
-- Fix: is_content_writer() must include the 'administrador' role.
-- The 'administrador' collaborator role was added in 20260717000000_administrador_role.sql
-- but is_content_writer() (20260611000000_roles_permissions.sql) still only allowed 'director',
-- silently blocking administrador content writes that the API permission layer allows.

CREATE OR REPLACE FUNCTION is_content_writer(project_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() = project_user_id THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaborador_user_id = auth.uid()
      AND admin_user_id = project_user_id
      AND estado = 'activo'
      AND rol IN ('administrador', 'director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_content_writer(uuid) IS
  'RLS helper: owner OR active collaborator with rol administrador/director. Used by all content-write policies (tipologias, galeria, videos, fachadas, planos, recursos, torres, vistas_piso, complementos, galeria_grupos, unidades insert/delete).';
```

- [ ] **Step 4: Apply the migration**

```bash
npm run db:migrate
```
Expected: Supabase CLI lists `20260720000000_fix_is_content_writer_administrador.sql` as applied with no error.

- [ ] **Step 5: Re-run the assertion — expect PASS**

```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_content_writer.sql"
```
Expected:
```
NOTICE:  PASS: is_content_writer authorizes administrador
```

- [ ] **Step 6: Functional role-impersonation assertion (administrador can now write a tipología)**

Run against a DB that has at least one project + one active `administrador` collaborator (or seed one in a transaction). Use a rollback-only transaction so no data persists:

```sql
BEGIN;
-- Pick a real project + its admin owner
WITH p AS (SELECT id AS proyecto_id, user_id AS admin_id FROM proyectos LIMIT 1)
SELECT proyecto_id, admin_id FROM p \gset
-- Create a fake administrador collaborator bound to that admin
INSERT INTO colaboradores (admin_user_id, colaborador_user_id, email, rol, estado)
VALUES (:'admin_id', gen_random_uuid(), 'rls-test-admin@example.com', 'administrador', 'activo')
RETURNING colaborador_user_id AS collab_id \gset
-- Impersonate that collaborator at the RLS layer
SELECT set_config('request.jwt.claims', json_build_object('sub', :'collab_id', 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
-- This INSERT must SUCCEED now (would have raised RLS violation before the fix)
INSERT INTO tipologias (proyecto_id, nombre) VALUES (:'proyecto_id', 'RLS administrador write test');
RESET ROLE;
ROLLBACK;
```
Expected: `INSERT 0 1` for the tipologías insert (no `new row violates row-level security policy` error), then `ROLLBACK`.

- [ ] **Step 7: Verify gate + commit**

```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720000000_fix_is_content_writer_administrador.sql
git commit -m "fix: include administrador role in is_content_writer RLS helper"
```
Expected: typecheck/lint clean (no source files touched), commit created on `fix/db-rls-isolation`.

---

### Task 2: Allow collaborator (administrador) project creation in RLS to match the API

**Root cause (verified):** `src/app/api/proyectos/route.ts:44` permits `project.create` for `administrador`+ and inserts with `user_id: auth.adminUserId` (`:87`) — i.e. the **admin's** id, not the collaborator's. But the INSERT policy `"Owner insert projects"` (`supabase/migrations/20260320000000_colaboradores.sql:68-70`) is `WITH CHECK (auth.uid() = user_id)`. For a collaborator, `auth.uid()` is the collaborator's id while `user_id` is the admin's id, so the check fails and project creation by an `administrador` is blocked at the DB even though the API allows it.

> **DECISION GATE — Should `administrador` collaborators be allowed to CREATE projects at all?**
> `src/lib/permissions.ts:64` sets `"project.create": "administrador"`, implying YES at the product level. Confirm with the owner whether an `administrador` should be able to create a new project under the admin's account (counts against the admin's `max_projects` plan limit).
> - **Branch A (YES — align RLS to API, recommended, matches current permissions.ts):** implement Step 3A below (policy uses `is_content_writer`-style ownership-or-administrador check).
> - **Branch B (NO — owner-only creation):** do NOT change the RLS policy; instead change `src/app/api/proyectos/route.ts` permission to `project.create: "admin"` and `src/lib/permissions.ts:64` to `"admin"`. That is an APP change, out of scope for this DB plan — hand it to the API-layer plan and SKIP this task's migration. Record the decision and move on.

**Files (Branch A):**
- Create: `supabase/migrations/20260720100000_fix_proyectos_insert_collaborator.sql`
- Verify (assertions): inline SQL below

- [ ] **Step 1: Assertion that currently FAILS (Branch A)**

Scratch file `...\scratchpad\assert_proyectos_insert.sql`:
```sql
-- Expect the proyectos INSERT policy WITH CHECK to allow administrador collaborators.
DO $$
DECLARE chk text;
BEGIN
  SELECT pg_get_expr(pol.polwithcheck, pol.polrelid)
    INTO chk
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  WHERE c.relname = 'proyectos' AND pol.polcmd = 'a';  -- 'a' = INSERT (WITH CHECK)
  IF chk IS NULL OR position('is_admin_or_owner' in chk) = 0 THEN
    RAISE EXCEPTION 'FAIL: proyectos INSERT check does not use is_admin_or_owner. Got: %', chk;
  END IF;
  RAISE NOTICE 'PASS: proyectos INSERT allows administrador via is_admin_or_owner';
END $$;
```

- [ ] **Step 2: Run assertion — expect FAIL**
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_proyectos_insert.sql"
```
Expected: `ERROR: FAIL: proyectos INSERT check does not use is_admin_or_owner. Got: (auth.uid() = user_id)`

- [ ] **Step 3A: Write the migration (Branch A)**

Create `supabase/migrations/20260720100000_fix_proyectos_insert_collaborator.sql`. Add a dedicated helper (so the predicate is reusable + named in assertions) and re-create the INSERT policy:

```sql
-- Fix: allow 'administrador' collaborators to create projects under the admin's account,
-- matching src/lib/permissions.ts ("project.create": "administrador") and
-- src/app/api/proyectos/route.ts which inserts with user_id = auth.adminUserId.
-- The old "Owner insert projects" check (auth.uid() = user_id) blocked collaborators
-- because their auth.uid() is not the admin's user_id.

-- Helper: true if current user owns the account OR is an active administrador collaborator of it.
CREATE OR REPLACE FUNCTION is_admin_or_owner(project_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() = project_user_id THEN RETURN TRUE; END IF;
  RETURN EXISTS (
    SELECT 1 FROM colaboradores
    WHERE colaborador_user_id = auth.uid()
      AND admin_user_id = project_user_id
      AND estado = 'activo'
      AND rol = 'administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION is_admin_or_owner(uuid) IS
  'RLS helper: owner OR active administrador collaborator. Use for near-owner actions (project create/clone/config) that exclude director/asesor.';

DROP POLICY IF EXISTS "Owner insert projects" ON proyectos;

CREATE POLICY "Admin or owner insert projects"
  ON proyectos FOR INSERT
  WITH CHECK (is_admin_or_owner(user_id));
```

- [ ] **Step 4: Apply + re-run assertion — expect PASS**
```bash
npm run db:migrate
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_proyectos_insert.sql"
```
Expected: `NOTICE: PASS: proyectos INSERT allows administrador via is_admin_or_owner`

- [ ] **Step 5: Functional role-impersonation assertion (administrador creates a project; director CANNOT)**
```sql
BEGIN;
SELECT user_id AS admin_id FROM proyectos LIMIT 1 \gset
-- administrador can insert
INSERT INTO colaboradores (admin_user_id, colaborador_user_id, email, rol, estado)
VALUES (:'admin_id', gen_random_uuid(), 'rls-admin2@example.com', 'administrador', 'activo')
RETURNING colaborador_user_id AS a_id \gset
SELECT set_config('request.jwt.claims', json_build_object('sub', :'a_id','role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
INSERT INTO proyectos (user_id, slug, nombre)
VALUES (:'admin_id', 'rls-test-'||substr(md5(random()::text),1,8), 'RLS admin create test');  -- expect INSERT 0 1
RESET ROLE;
-- director must be blocked
INSERT INTO colaboradores (admin_user_id, colaborador_user_id, email, rol, estado)
VALUES (:'admin_id', gen_random_uuid(), 'rls-dir@example.com', 'director', 'activo')
RETURNING colaborador_user_id AS d_id \gset
SELECT set_config('request.jwt.claims', json_build_object('sub', :'d_id','role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
-- expect: ERROR new row violates row-level security policy
INSERT INTO proyectos (user_id, slug, nombre)
VALUES (:'admin_id', 'rls-test-'||substr(md5(random()::text),1,8), 'RLS director create test (should fail)');
RESET ROLE;
ROLLBACK;
```
Expected: first insert `INSERT 0 1`; director insert raises `new row violates row-level security policy for table "proyectos"`; transaction rolled back.

- [ ] **Step 6: Verify gate + commit**
```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720100000_fix_proyectos_insert_collaborator.sql
git commit -m "fix: allow administrador collaborators to create projects in RLS"
```
Expected: clean gate, commit on `fix/db-rls-isolation`.

---

### Task 3: Let authorized collaborators write `tipologia_precio_historial` (price-history insert breaks tipología create/price edit)

**Root cause (verified):** `tipologia_precio_historial` policies in `supabase/migrations/20260716000000_fix_precio_historial_rls.sql:5-25` gate INSERT/SELECT on `p.user_id = auth.uid()` (owner only). But `src/app/api/tipologias/route.ts:44-53` inserts a `tipologia_precio_historial` row through `auth.supabase` whenever a tipología is created with a price — for ANY content writer, including `director`/`administrador` collaborators. For those collaborators the price-history insert is blocked by RLS, so collaborator-created priced tipologías throw (the route does not swallow this insert error at `:45`). SELECT is likewise owner-only, hiding price history from collaborators who can otherwise see the tipología.

**Files:**
- Create: `supabase/migrations/20260720200000_fix_precio_historial_collaborator_rls.sql`
- Verify (assertions): inline SQL below

- [ ] **Step 1: Assertion that currently FAILS**

Scratch file `...\scratchpad\assert_precio_historial.sql`:
```sql
DO $$
DECLARE ins text; sel text;
BEGIN
  SELECT pg_get_expr(polwithcheck, polrelid) INTO ins
  FROM pg_policy WHERE polrelid='tipologia_precio_historial'::regclass AND polcmd='a';
  SELECT pg_get_expr(polqual, polrelid) INTO sel
  FROM pg_policy WHERE polrelid='tipologia_precio_historial'::regclass AND polcmd='r' -- 'r' = SELECT
  ORDER BY 1 LIMIT 1;
  IF ins IS NULL OR position('is_content_writer' in ins) = 0 THEN
    RAISE EXCEPTION 'FAIL: precio_historial INSERT does not use is_content_writer. Got: %', ins;
  END IF;
  IF sel IS NULL OR position('is_project_authorized' in sel) = 0 THEN
    RAISE EXCEPTION 'FAIL: precio_historial SELECT does not use is_project_authorized. Got: %', sel;
  END IF;
  RAISE NOTICE 'PASS: precio_historial policies allow authorized collaborators';
END $$;
```

- [ ] **Step 2: Run — expect FAIL**
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_precio_historial.sql"
```
Expected: `ERROR: FAIL: precio_historial INSERT does not use is_content_writer. Got: (EXISTS ( SELECT 1 ... WHERE ... p.user_id = auth.uid()))`

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20260720200000_fix_precio_historial_collaborator_rls.sql`:

```sql
-- Fix: tipologia_precio_historial was owner-only, blocking director/administrador
-- collaborators from the price-history insert that POST /api/tipologias performs
-- (src/app/api/tipologias/route.ts) and hiding history on SELECT.
-- Align with the content-write model: content writers can insert, all authorized can read.

DROP POLICY IF EXISTS "Users insert own precio historial" ON tipologia_precio_historial;
DROP POLICY IF EXISTS "Users read own precio historial" ON tipologia_precio_historial;

CREATE POLICY "Content writer insert precio historial"
  ON tipologia_precio_historial FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tipologias t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE t.id = tipologia_id
      AND is_content_writer(p.user_id)
    )
  );

CREATE POLICY "Authorized read precio historial"
  ON tipologia_precio_historial FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tipologias t
      JOIN proyectos p ON p.id = t.proyecto_id
      WHERE t.id = tipologia_precio_historial.tipologia_id
      AND is_project_authorized(p.user_id)
    )
  );

-- Keep platform-admin full access; re-create it to use the canonical helper (see Task 4).
DROP POLICY IF EXISTS "Platform admins manage precio historial" ON tipologia_precio_historial;
CREATE POLICY "Platform admins manage precio historial"
  ON tipologia_precio_historial FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

- [ ] **Step 4: Apply + re-run assertion — expect PASS**
```bash
npm run db:migrate
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_precio_historial.sql"
```
Expected: `NOTICE: PASS: precio_historial policies allow authorized collaborators`

- [ ] **Step 5: Functional assertion (director inserts price history through the tipología path)**
```sql
BEGIN;
SELECT id AS tip_id, proyecto_id FROM tipologias LIMIT 1 \gset
SELECT user_id AS admin_id FROM proyectos WHERE id = :'proyecto_id' \gset
INSERT INTO colaboradores (admin_user_id, colaborador_user_id, email, rol, estado)
VALUES (:'admin_id', gen_random_uuid(), 'rls-dir2@example.com', 'director', 'activo')
RETURNING colaborador_user_id AS d_id \gset
SELECT set_config('request.jwt.claims', json_build_object('sub', :'d_id','role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
-- expect INSERT 0 1 (was an RLS violation before)
INSERT INTO tipologia_precio_historial (tipologia_id, precio_anterior, precio_nuevo, changed_by)
VALUES (:'tip_id', NULL, 123456, 'rls-dir2@example.com');
RESET ROLE;
ROLLBACK;
```
Expected: `INSERT 0 1`, then `ROLLBACK`.

- [ ] **Step 6: Verify gate + commit**
```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720200000_fix_precio_historial_collaborator_rls.sql
git commit -m "fix: allow content writers to write tipologia_precio_historial in RLS"
```
Expected: clean gate, commit on `fix/db-rls-isolation`.

---

### Task 4: Standardize all platform-admin RLS checks on `is_platform_admin()` (recursion / consistency hardening)

**Root cause (verified):** `supabase/migrations/20260409100000_fix_platform_admins_rls.sql` introduced `public.is_platform_admin(uuid)` (SECURITY DEFINER, bypasses RLS) specifically to fix infinite recursion on `platform_admins` policies. But several later migrations re-introduced the raw sub-select pattern `EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())` instead of calling the helper — confirmed in `supabase/migrations/20260716000000_fix_precio_historial_rls.sql:30-31` (fixed in Task 3) and `supabase/migrations/20260715000000_plan_basico_pro.sql:89-91,118-120` (`invoices`, `billing_events`). Raw sub-selects against `platform_admins` from a policy are the exact shape that caused the original recursion and behave inconsistently if `platform_admins` RLS changes again. Standardize them on the helper.

**Files:**
- Create: `supabase/migrations/20260720300000_standardize_platform_admin_checks.sql`
- Verify (assertions): inline SQL below

- [ ] **Step 1: Discovery query — list every policy still using a raw `platform_admins` sub-select**

Run this first to confirm the exact target set on the live DB (do not assume; the audit found `invoices` + `billing_events`, plus `user_plans`/`platform_admins` already fixed):
```sql
SELECT c.relname AS table_name, pol.polname AS policy_name,
       pg_get_expr(COALESCE(pol.polqual, pol.polwithcheck), pol.polrelid) AS expr
FROM pg_policy pol
JOIN pg_class c ON c.oid = pol.polrelid
WHERE pg_get_expr(COALESCE(pol.polqual, pol.polwithcheck), pol.polrelid) ILIKE '%from platform_admins%'
  AND pg_get_expr(COALESCE(pol.polqual, pol.polwithcheck), pol.polrelid) NOT ILIKE '%is_platform_admin%'
ORDER BY 1, 2;
```
Expected rows (at minimum): `billing_events / Platform admins manage all billing events`, `invoices / Platform admins manage all invoices`. Record any additional rows the query returns and add them to Step 3.

- [ ] **Step 2: Assertion that currently FAILS**

Scratch file `...\scratchpad\assert_platform_admin_std.sql`:
```sql
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n
  FROM pg_policy pol
  JOIN pg_class c ON c.oid = pol.polrelid
  WHERE pg_get_expr(COALESCE(pol.polqual, pol.polwithcheck), pol.polrelid) ILIKE '%from platform_admins%'
    AND pg_get_expr(COALESCE(pol.polqual, pol.polwithcheck), pol.polrelid) NOT ILIKE '%is_platform_admin%';
  IF n > 0 THEN
    RAISE EXCEPTION 'FAIL: % policies still use a raw platform_admins sub-select', n;
  END IF;
  RAISE NOTICE 'PASS: all platform-admin policies use is_platform_admin()';
END $$;
```

- [ ] **Step 3: Run — expect FAIL**
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_platform_admin_std.sql"
```
Expected: `ERROR: FAIL: 2 policies still use a raw platform_admins sub-select` (or higher if Step 1 found more).

- [ ] **Step 4: Write the migration**

Create `supabase/migrations/20260720300000_standardize_platform_admin_checks.sql`. Include the two confirmed tables plus any extras Step 1 surfaced:

```sql
-- Hardening: replace raw "EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())"
-- sub-selects with the canonical public.is_platform_admin(auth.uid()) helper
-- (created in 20260409100000_fix_platform_admins_rls.sql to avoid recursion + drift).
-- Tables: invoices, billing_events (from 20260715000000_plan_basico_pro.sql).
-- (tipologia_precio_historial handled in 20260720200000.)

-- invoices
DROP POLICY IF EXISTS "Platform admins manage all invoices" ON invoices;
CREATE POLICY "Platform admins manage all invoices"
  ON invoices FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- billing_events
DROP POLICY IF EXISTS "Platform admins manage all billing events" ON billing_events;
CREATE POLICY "Platform admins manage all billing events"
  ON billing_events FOR ALL
  USING (public.is_platform_admin(auth.uid()));
```

> If Step 1 surfaced additional tables, append an identical `DROP POLICY IF EXISTS ... ; CREATE POLICY ... USING (public.is_platform_admin(auth.uid()));` block for each, reusing the original policy name verbatim from the Step 1 output. Do NOT change the original `USING` semantics other than swapping the predicate to the helper.

- [ ] **Step 5: Apply + re-run assertion — expect PASS**
```bash
npm run db:migrate
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_platform_admin_std.sql"
```
Expected: `NOTICE: PASS: all platform-admin policies use is_platform_admin()`

- [ ] **Step 6: Regression assertion (a platform admin still has full access to invoices)**
```sql
BEGIN;
SELECT user_id AS pa_id FROM platform_admins LIMIT 1 \gset
SELECT set_config('request.jwt.claims', json_build_object('sub', :'pa_id','role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
-- expect: a row count >= 0 with NO permission error (policy evaluates via helper)
SELECT count(*) FROM invoices;
RESET ROLE;
ROLLBACK;
```
Expected: a numeric count returned (no error), then `ROLLBACK`. (If `platform_admins` is empty, seed one inside the transaction before impersonating.)

- [ ] **Step 7: Verify gate + commit**
```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720300000_standardize_platform_admin_checks.sql
git commit -m "chore: standardize platform-admin RLS checks on is_platform_admin()"
```
Expected: clean gate, commit on `fix/db-rls-isolation`.

---

### Task 5: Fix storage-quota plan-name drift in `get_user_storage_limit_bytes`

**Root cause (verified):** `get_user_storage_limit_bytes(uuid)` in `supabase/migrations/20260409000002_enforce_storage_quotas.sql:27-48` switches on plan names `'basic' / 'premium' / 'enterprise'`. The plan vocabulary changed twice afterward: `20260408000000_update_plan_system.sql` moved to `basic/premium/enterprise`, then `20260715000000_plan_basico_pro.sql:29-31` set the live `user_plans.plan` constraint to `'basico' / 'pro' / 'enterprise'`. The quota helper was never updated, so today `'pro'` falls through to the `ELSE 10737418240` branch (10 GB) instead of 50 GB, and `'basico'` matches no case (also ELSE → 10 GB, coincidentally correct). This under-reports the Pro storage limit in `check_storage_quota()` (the client-facing RPC) and in `user_can_upload()`.

> **DECISION GATE — Is RLS-level storage-quota enforcement still intended?**
> The actual upload path `src/app/api/upload/route.ts:48` uses `createAdminClient()` (service-role), which **bypasses** the `user_can_upload()` RLS check on `storage.objects` entirely. So `user_can_upload()` is currently DEAD as an enforcement gate; only `check_storage_quota()` (the advisory RPC) and the per-project `storage_limit_bytes` column actually surface limits. Confirm intent with the owner:
> - **Branch A (keep helper, fix the numbers — recommended, low-risk):** correct the plan-name mapping so `check_storage_quota()` and any future RLS use report the right limit. Implement Step 3 below. This is purely a correctness fix; it does not re-enable enforcement.
> - **Branch B (also re-enable RLS enforcement):** in addition to Step 3, the API upload route would need to stop using service-role for the `storage.objects` insert (move to the authenticated client) — that is an APP change, out of scope here; record it as a follow-up for the storage/API plan. Do NOT make the app change in this DB plan.
> Either branch, this task ships the SQL number fix; Branch B only adds a tracked follow-up.

**Files:**
- Create: `supabase/migrations/20260720400000_fix_storage_quota_plan_names.sql`
- Verify (assertions): inline SQL below

- [ ] **Step 1: Assertion that currently FAILS (Pro must map to 50 GB)**

Scratch file `...\scratchpad\assert_storage_quota.sql`:
```sql
-- Verify the helper body maps 'pro' explicitly. FAILS before the fix.
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef('public.get_user_storage_limit_bytes(uuid)'::regprocedure) INTO def;
  IF position('''pro''' in def) = 0 OR position('''basico''' in def) = 0 THEN
    RAISE EXCEPTION 'FAIL: get_user_storage_limit_bytes does not map basico/pro plan names. Body: %', def;
  END IF;
  RAISE NOTICE 'PASS: storage quota helper maps basico/pro/enterprise';
END $$;
```

- [ ] **Step 2: Run — expect FAIL**
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_storage_quota.sql"
```
Expected: `ERROR: FAIL: get_user_storage_limit_bytes does not map basico/pro plan names. Body: ...WHEN 'basic' THEN...`

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/20260720400000_fix_storage_quota_plan_names.sql`. Keep the same signature/volatility; only correct the plan-name `CASE` and keep legacy names mapped for safety:

```sql
-- Fix: get_user_storage_limit_bytes() still matched the retired plan names
-- (basic/premium/enterprise). Live user_plans.plan is now basico/pro/enterprise
-- (20260715000000_plan_basico_pro.sql), so 'pro' fell through to the 10GB ELSE
-- instead of 50GB. Re-map to current names; keep legacy aliases for safety.

CREATE OR REPLACE FUNCTION get_user_storage_limit_bytes(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan
  FROM user_plans
  WHERE user_id = p_user_id;

  IF user_plan IS NULL THEN
    RETURN 10737418240; -- 10GB default (no plan row)
  END IF;

  RETURN CASE user_plan
    WHEN 'basico'     THEN 10737418240    -- 10GB
    WHEN 'pro'        THEN 53687091200    -- 50GB
    WHEN 'enterprise' THEN 536870912000   -- 500GB
    -- legacy aliases (pre-20260715 data that may linger)
    WHEN 'basic'      THEN 10737418240    -- 10GB
    WHEN 'premium'    THEN 53687091200    -- 50GB
    ELSE 10737418240  -- default 10GB
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION get_user_storage_limit_bytes(uuid) IS
  'Returns storage limit in bytes by user_plans.plan: basico 10GB, pro 50GB, enterprise 500GB (legacy basic/premium aliased).';
```

- [ ] **Step 4: Apply + re-run assertion — expect PASS**
```bash
npm run db:migrate
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_storage_quota.sql"
```
Expected: `NOTICE: PASS: storage quota helper maps basico/pro/enterprise`

- [ ] **Step 5: Value assertion (a pro user resolves to exactly 50 GB)**
```sql
BEGIN;
SELECT user_id AS uid FROM user_plans LIMIT 1 \gset
UPDATE user_plans SET plan = 'pro' WHERE user_id = :'uid';
-- expect 53687091200
SELECT get_user_storage_limit_bytes(:'uid'::uuid) AS pro_limit_bytes;
ROLLBACK;
```
Expected: `pro_limit_bytes = 53687091200`, then `ROLLBACK`.

- [ ] **Step 6: Verify gate + commit**
```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720400000_fix_storage_quota_plan_names.sql
git commit -m "fix: correct plan-name mapping in get_user_storage_limit_bytes (pro=50GB)"
```
Expected: clean gate, commit. If Branch B was chosen at the gate, also record the API follow-up in the storage/API plan tracker (no code change here).

---

### Task 6: Defense-in-depth — enforce per-project (`colaborador_proyectos`) scoping at the RLS layer

**Root cause (verified):** Per-project collaborator scoping lives ONLY in the API: `getAccessibleProjectIds()` (`src/lib/auth-context.ts:155-167`) reads `colaborador_proyectos` and filters queries (e.g. `src/app/api/unidades/route.ts:19-22`, `src/app/api/proyectos/route.ts:20-23`). RLS itself uses `is_project_authorized()` / `is_content_writer()`, which check only `colaboradores` membership (admin-account level), NOT the per-project `colaborador_proyectos` rows. So a `director` scoped to project A can, via any endpoint that forgets the `getAccessibleProjectIds` filter or via a direct PostgREST call with the user's JWT, read/write project B of the same admin. The `colaborador_proyectos` table's own comment (`supabase/migrations/20260328000000_colaborador_proyectos.sql:1-3`) documents the intended scoping; RLS never enforced it. This is a within-tenant (same admin) escalation, lower severity than cross-tenant, but it is the kind of gap RLS exists to backstop.

> **DECISION GATE — Tighten RLS to honor `colaborador_proyectos`, or keep it API-only?**
> Honoring it in RLS is the correct defense-in-depth posture, but it changes the meaning of "authorized" for scoped collaborators and could surface latent bugs where the UI relied on broad RLS. The documented contract (migration `20260328000000`) is: a collaborator with ZERO `colaborador_proyectos` rows sees ALL admin projects (backward-compat); with rows, only those projects.
> - **Branch A (enforce in RLS — recommended):** add a `collab_can_access_project(p_proyecto_id, project_user_id)` helper encoding the documented contract and fold it into `is_project_authorized`. Implement Steps 3A–5A. Ship behind the smoke described in Step 5A; if any scoped-collaborator UI regression appears in preview, roll back this one migration (it is isolated).
> - **Branch B (keep API-only for now):** SKIP the migration; instead add ONLY the helper function (Step 3B) without wiring it into policies, plus a code-comment task for the API plan to centralize the filter. Record the decision; the within-tenant gap remains accepted risk until Branch A is approved.

**Files (Branch A):**
- Create: `supabase/migrations/20260720500000_enforce_colaborador_proyectos_rls.sql`
- Verify (assertions): inline SQL below

- [ ] **Step 1: Assertion that currently FAILS (Branch A) — `is_project_authorized` must consider project scoping**

Scratch file `...\scratchpad\assert_project_scoping.sql`:
```sql
DO $$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef('public.is_project_authorized(uuid)'::regprocedure) INTO def;
  IF position('collab_can_access_project' in def) = 0 THEN
    RAISE EXCEPTION 'FAIL: is_project_authorized does not consult colaborador_proyectos scoping';
  END IF;
  RAISE NOTICE 'PASS: is_project_authorized honors per-project scoping';
END $$;
```

- [ ] **Step 2: Run — expect FAIL**
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_project_scoping.sql"
```
Expected: `ERROR: FAIL: is_project_authorized does not consult colaborador_proyectos scoping`

- [ ] **Step 3A: Write the migration (Branch A)**

`is_project_authorized` currently only receives `project_user_id`, not the specific project id — so the scoping logic must be added by extending the helper to also accept the project id. To avoid breaking the ~20 policies that call the 1-arg form, add a NEW 2-arg overload `is_project_authorized(p_proyecto_id uuid, project_user_id uuid)` plus the scoping helper, and re-point only the `proyectos`-keyed policies that have the project id in scope. Create `supabase/migrations/20260720500000_enforce_colaborador_proyectos_rls.sql`:

```sql
-- Defense-in-depth: honor colaborador_proyectos per-project scoping in RLS.
-- Contract (per 20260328000000_colaborador_proyectos.sql):
--   collaborator with ZERO colaborador_proyectos rows -> all admin projects (backward compat)
--   collaborator with rows -> only those projects.
-- Owners and administrador collaborators are NOT scoped (full account access).

-- 1. Scoping helper: can the current collaborator reach THIS project?
CREATE OR REPLACE FUNCTION collab_can_access_project(p_proyecto_id UUID, project_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  collab_id UUID;
  collab_rol TEXT;
  has_scoping BOOLEAN;
BEGIN
  -- Owner always allowed
  IF auth.uid() = project_user_id THEN RETURN TRUE; END IF;

  SELECT id, rol INTO collab_id, collab_rol
  FROM colaboradores
  WHERE colaborador_user_id = auth.uid()
    AND admin_user_id = project_user_id
    AND estado = 'activo'
  LIMIT 1;

  IF collab_id IS NULL THEN RETURN FALSE; END IF;     -- not a collaborator of this admin
  IF collab_rol = 'administrador' THEN RETURN TRUE; END IF;  -- administrador = full account

  -- Scoped roles (director/asesor): zero rows => all projects (backward compat)
  SELECT EXISTS (SELECT 1 FROM colaborador_proyectos WHERE colaborador_id = collab_id)
    INTO has_scoping;
  IF NOT has_scoping THEN RETURN TRUE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM colaborador_proyectos
    WHERE colaborador_id = collab_id AND proyecto_id = p_proyecto_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION collab_can_access_project(uuid, uuid) IS
  'RLS helper: owner/administrador full access; director/asesor limited to colaborador_proyectos rows (zero rows = all, backward compat).';

-- 2. Re-point the proyectos SELECT policy to enforce scoping (project id is the row id here).
DROP POLICY IF EXISTS "Authorized select projects" ON proyectos;
CREATE POLICY "Authorized select projects"
  ON proyectos FOR SELECT
  USING (
    estado = 'publicado'
    OR auth.uid() = user_id
    OR (is_project_authorized(user_id) AND collab_can_access_project(id, user_id))
  );

-- 3. Re-point the proyectos UPDATE policy (set estado etc.) to enforce scoping.
DROP POLICY IF EXISTS "Authorized update projects" ON proyectos;
CREATE POLICY "Authorized update projects"
  ON proyectos FOR UPDATE
  USING (is_project_authorized(user_id) AND collab_can_access_project(id, user_id));
```

> NOTE (scope boundary): child-table policies (tipologias, unidades, etc.) reference `proyecto_id`, so a complete enforcement would also fold `collab_can_access_project(proyecto_id, p.user_id)` into each child policy's `EXISTS (...)`. That is a large additive change; do it as a SECOND migration `20260720510000_scope_child_tables_rls.sql` ONLY after Step 5A confirms the `proyectos`-level change is clean in preview. Keep this task's first migration limited to `proyectos` to bound blast radius. If the owner wants child-table scoping in the same pass, add the child-policy re-creations following the exact `is_content_writer`/`is_project_authorized` patterns already in `20260611000000_roles_permissions.sql`, each `AND collab_can_access_project(proyecto_id, p.user_id)`.

- [ ] **Step 4A: Apply + re-run assertion — expect PASS**
```bash
npm run db:migrate
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/assert_project_scoping.sql"
```
Expected: `NOTICE: PASS: is_project_authorized honors per-project scoping` — wait: the 1-arg `is_project_authorized` body did NOT change, so this assertion (which checks that function) will still fail. Replace the assertion target with the policy expression check below and re-run:

Scratch file `...\scratchpad\assert_project_scoping.sql` (final version):
```sql
DO $$
DECLARE q text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid) INTO q
  FROM pg_policy WHERE polrelid='proyectos'::regclass AND polname='Authorized select projects';
  IF q IS NULL OR position('collab_can_access_project' in q) = 0 THEN
    RAISE EXCEPTION 'FAIL: proyectos SELECT policy does not enforce per-project scoping. Got: %', q;
  END IF;
  RAISE NOTICE 'PASS: proyectos SELECT enforces colaborador_proyectos scoping';
END $$;
```
Re-run; expected `NOTICE: PASS: proyectos SELECT enforces colaborador_proyectos scoping`.

- [ ] **Step 5A: Functional assertion (director scoped to project A cannot SELECT project B; with zero scoping sees both)**
```sql
BEGIN;
-- Need two projects under the same admin; create a transient second if needed.
SELECT id AS proj_a, user_id AS admin_id FROM proyectos LIMIT 1 \gset
INSERT INTO proyectos (user_id, slug, nombre, estado)
VALUES (:'admin_id', 'rls-projb-'||substr(md5(random()::text),1,8), 'RLS Project B', 'borrador')
RETURNING id AS proj_b \gset
INSERT INTO colaboradores (admin_user_id, colaborador_user_id, email, rol, estado)
VALUES (:'admin_id', gen_random_uuid(), 'rls-scoped-dir@example.com', 'director', 'activo')
RETURNING id AS collab_pk, colaborador_user_id AS collab_uid \gset
-- Scope this director to project A only
INSERT INTO colaborador_proyectos (colaborador_id, proyecto_id) VALUES (:'collab_pk', :'proj_a');
SELECT set_config('request.jwt.claims', json_build_object('sub', :'collab_uid','role','authenticated')::text, true);
SET LOCAL ROLE authenticated;
-- expect: proj_a visible (1), proj_b NOT visible (0)
SELECT count(*) FILTER (WHERE id = :'proj_a') AS sees_a,
       count(*) FILTER (WHERE id = :'proj_b') AS sees_b
FROM proyectos WHERE user_id = :'admin_id';
RESET ROLE;
ROLLBACK;
```
Expected: `sees_a = 1`, `sees_b = 0`. (For the backward-compat path, repeat without the `colaborador_proyectos` insert and assert `sees_a = 1` AND `sees_b = 1`.)

- [ ] **Step 6: Verify gate + commit**
```bash
npm run typecheck && npm run lint
git add supabase/migrations/20260720500000_enforce_colaborador_proyectos_rls.sql
git commit -m "feat: enforce colaborador_proyectos per-project scoping in proyectos RLS"
```
Expected: clean gate, commit on `fix/db-rls-isolation`.

---

### Task 7: Consolidated regression sweep + finish branch

**Files:**
- Create: `C:\Users\juanj\AppData\Local\Temp\claude\C--Users-juanj\48328299-b63a-4446-bc39-74849d4a9933\scratchpad\rls_regression_sweep.sql` (verification only; not committed)

- [ ] **Step 1: Run the full assertion sweep against the migrated DB**

Concatenate all task assertions plus a "no table has RLS enabled with zero policies" guard (the exact class of bug that caused `20260716000000_fix_precio_historial_rls.sql`). Create the sweep file:
```sql
-- 1) RLS-enabled tables that have NO policy at all (would block everything)
DO $$
DECLARE r record; bad text := '';
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid)
  LOOP bad := bad || r.relname || ' '; END LOOP;
  IF length(bad) > 0 THEN
    RAISE EXCEPTION 'FAIL: RLS enabled but no policies on: %', bad;
  END IF;
  RAISE NOTICE 'PASS: every RLS-enabled public table has >=1 policy';
END $$;

-- 2) is_content_writer includes administrador
DO $$ DECLARE d text; BEGIN
  SELECT pg_get_functiondef('public.is_content_writer(uuid)'::regprocedure) INTO d;
  IF position('administrador' in d)=0 THEN RAISE EXCEPTION 'FAIL content_writer'; END IF;
  RAISE NOTICE 'PASS content_writer'; END $$;

-- 3) no raw platform_admins sub-selects remain
DO $$ DECLARE n int; BEGIN
  SELECT count(*) INTO n FROM pg_policy pol
  WHERE pg_get_expr(COALESCE(pol.polqual,pol.polwithcheck),pol.polrelid) ILIKE '%from platform_admins%'
    AND pg_get_expr(COALESCE(pol.polqual,pol.polwithcheck),pol.polrelid) NOT ILIKE '%is_platform_admin%';
  IF n>0 THEN RAISE EXCEPTION 'FAIL platform_admin raw subselects: %', n; END IF;
  RAISE NOTICE 'PASS platform_admin standardized'; END $$;

-- 4) storage quota maps pro
DO $$ DECLARE d text; BEGIN
  SELECT pg_get_functiondef('public.get_user_storage_limit_bytes(uuid)'::regprocedure) INTO d;
  IF position('''pro''' in d)=0 THEN RAISE EXCEPTION 'FAIL storage quota'; END IF;
  RAISE NOTICE 'PASS storage quota'; END $$;
```
Run:
```bash
psql "$DATABASE_URL" -f "C:/Users/juanj/AppData/Local/Temp/claude/C--Users-juanj/48328299-b63a-4446-bc39-74849d4a9933/scratchpad/rls_regression_sweep.sql"
```
Expected: four `PASS` notices, no `ERROR`.

- [ ] **Step 2: Final verify gate**
```bash
npm run typecheck && npm run lint
```
Expected: both clean.

- [ ] **Step 3: Push branch + open PR to `dev` (NOT main)**
```bash
git push -u origin fix/db-rls-isolation
gh pr create --base dev --head fix/db-rls-isolation \
  --title "fix: align RLS tenant-isolation policies with 4-role model" \
  --body "Closes RLS/permission mismatches: is_content_writer(administrador), proyectos insert for collaborators, precio_historial collaborator writes, platform-admin helper standardization, storage-quota plan-name drift, colaborador_proyectos scoping. All migrations additive/idempotent; SQL assertions in PR description. Production db:migrate gated on owner approval (see plan global DECISION GATE)."
```
Expected: PR opened against `dev`. Do NOT merge to `main`; the owner approves production application of the migrations.

- [ ] **Step 4: Use superpowers:finishing-a-development-branch** to present merge/cleanup options to the owner once the PR is approved on `dev`.

---

## Task dependency / order

```
Branch setup (once)
 └─ Task 1  is_content_writer(administrador)            [CRITICAL, no deps]
 └─ Task 2  proyectos insert for collaborators          [no deps; DECISION GATE]
 └─ Task 3  precio_historial collaborator writes        [depends on Task 1's is_content_writer fix being applied first — uses it]
 └─ Task 4  platform-admin helper standardization       [Task 3 re-creates the precio_historial admin policy with the helper; run Task 3 before or together]
 └─ Task 5  storage-quota plan names                     [independent; DECISION GATE]
 └─ Task 6  colaborador_proyectos scoping                [independent; DECISION GATE; ship proyectos-level first, child tables as optional follow-up migration]
 └─ Task 7  regression sweep + PR                        [LAST; depends on all chosen tasks]
```
Hard ordering: **Task 1 before Task 3** (Task 3's INSERT policy calls `is_content_writer`, which must already include `administrador`). Tasks 2, 5, 6 are mutually independent and may be done in any order. Task 4 should run after Task 3 (Task 3 already converts the `precio_historial` platform-admin policy to the helper, so Task 4 won't need to re-touch it). Task 7 is always last.

## Per-task effort estimate

| Task | Scope | Estimate |
|------|-------|----------|
| 1 | Single `CREATE OR REPLACE FUNCTION` + impersonation assertion | 0.5d |
| 2 | New helper + 1 policy + 2 decision branches | 0.5d |
| 3 | 2 policy re-creations + functional assertion | 0.5d |
| 4 | Discovery query + N policy re-creations (2 confirmed) | 0.5d |
| 5 | Single function fix + value assertion + decision branch | 0.5d |
| 6 | New helper + 2 proyectos policies (+ optional child-table follow-up migration) | 1–2d |
| 7 | Regression sweep + PR + finish-branch | 0.5d |

**Total (excluding optional child-table scoping in Task 6 and any APP follow-ups from Branch-B gates): ~3.5–4.5d.** Add ~1d if the owner elects child-table per-project scoping in Task 6.
