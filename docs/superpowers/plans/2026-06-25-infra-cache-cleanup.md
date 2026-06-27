# Cache Revalidation + Infra Config + Env + Repo Cleanup Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two on-demand cache-revalidation gaps that leave published microsites stale (publish-availability and restore-version), correct the dead/misaimed Vercel function config and missing serverless font tracing so heavy PDF/image routes get the runtime they need, and remove tracked debug junk from the repo root.

**Architecture:** The public microsite reads project data through `getProyectoBySlug` in `src/lib/supabase/cached-queries.ts`, which wraps `server-queries.getProyectoBySlug` in `unstable_cache` (1 h TTL, tags `proyecto-${slug}` + `proyectos`). Any route that mutates the published `proyecto_versiones` snapshot or the `proyectos` row MUST call `revalidateProyecto(slug)` (and the subdomain) so the next request rebuilds; two such routes currently skip it. Separately, the app is 100% App Router (`src/app/api/**`) so the `vercel.json` `functions` glob (`pages/api/**`) matches nothing — heavy PDF routes run on Vercel defaults and one PDF route is missing its font files in the serverless bundle. We fix revalidation in the route handlers (TDD), fix runtime via in-route `export const maxDuration` plus a corrected `vercel.json` glob, add the missing `outputFileTracingIncludes` entry, and untrack the root debug artifacts.

**Tech Stack:** Next.js 16.1.6 App Router (`unstable_cache` / `revalidateTag` from `next/cache`, route segment config `maxDuration`, `outputFileTracingIncludes`), Vitest (introduced here as the unit runner per WORKFLOW verify gate), Supabase JS, `@react-pdf/renderer`, Vercel `vercel.json`, git.

---

## Branch & governance (read first)

- All work happens on a branch **off `dev`**, never `main` (WORKFLOW.md). Create it once at the start:
  ```bash
  git checkout dev && git pull origin dev
  git checkout -b fix/infra-cache-cleanup
  ```
  If `dev` is not present locally yet: `git fetch origin dev:dev` first. (Current checkout is `main`; do NOT commit there.)
- Conventional commit prefixes: `fix:` / `chore:` / `test:` as noted per task.
- **Verify gate before every commit:** `npm run typecheck && npm run lint` (and `npm test` once Task 1 adds Vitest). Each task lists the exact commands.
- READ-ONLY note for planning is over; during execution you DO edit source — but only the files named in each task's **Files** block.

---

### Task 1: Add Vitest as the unit-test runner (enables the verify gate `npm test`)

There is no unit runner yet (`package.json` has only `test:e2e` Playwright; no `vitest.config.*`, no `vitest` dep). The two revalidation fixes (Tasks 2–3) are TDD and need a real runner. This task wires Vitest with a tiny smoke test and the `test` script.

**Files:**
- Modify: `package.json` (add `vitest` + `@vitest/coverage-v8` devDeps and a `test` script)
- Create: `vitest.config.ts`
- Create test: `src/lib/__tests__/smoke.test.ts`

- [ ] **Step 1 — Install Vitest (dev only).** `.npmrc` already has `legacy-peer-deps=true`, so a plain install is fine:
  ```bash
  npm install -D vitest@^3 @vitest/coverage-v8@^3
  ```
  Expected: `package.json` `devDependencies` now contains `vitest` and `@vitest/coverage-v8`; `package-lock.json` updated; exit 0.

- [ ] **Step 2 — Add the `test` script.** In `package.json` `"scripts"`, add after the existing `"test:e2e:headed"` line:
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  ```
  (Keep the existing `test:e2e*` Playwright scripts untouched — they use a different runner/dir `tests/e2e`.)

- [ ] **Step 3 — Create `vitest.config.ts`** at repo root. Node environment (the code under test is server-only: route handlers + Supabase). Exclude the Playwright dir so the two runners never collide:
  ```ts
  import { defineConfig } from "vitest/config";
  import { fileURLToPath } from "node:url";

  export default defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  });
  ```

- [ ] **Step 4 — Write the smoke test (REAL test).** Create `src/lib/__tests__/smoke.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";

  describe("vitest wiring", () => {
    it("runs", () => {
      expect(1 + 1).toBe(2);
    });
  });
  ```

- [ ] **Step 5 — Run it (expect PASS).**
  ```bash
  npm test
  ```
  Expected output: `✓ src/lib/__tests__/smoke.test.ts (1 test)` and `Test Files  1 passed (1)`, exit 0. If `vitest: command not found`, re-run Step 1.

- [ ] **Step 6 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add package.json package-lock.json vitest.config.ts src/lib/__tests__/smoke.test.ts
  git commit -m "test: add vitest unit runner and test script"
  ```
  Expected: typecheck/lint exit 0, vitest 1 passed, commit created.

---

### Task 2: Revalidate microsite cache when availability is published (`publicar-disponibilidad`)

`src/app/api/proyectos/[id]/publicar-disponibilidad/route.ts` updates the latest `proyecto_versiones.snapshot.unidades` (the published availability the microsite renders) but never invalidates the `proyecto-${slug}` cache tag. Because `getProyectoBySlug` caches for 1 h, published availability changes are invisible to the public microsite for up to an hour. The sibling routes (`publicar`, `despublicar`, `[id]/route.ts`) all call `revalidateProyecto` after a snapshot/row mutation; this route must match that pattern. Note the route currently selects only `id, user_id`, so we must also fetch `slug, subdomain` to revalidate.

**Files:**
- Modify: `src/app/api/proyectos/[id]/publicar-disponibilidad/route.ts` (import on line 1 area; select on line ~17-20; revalidate after the snapshot update at line ~67)
- Create test: `src/app/api/proyectos/[id]/publicar-disponibilidad/__tests__/revalidate.test.ts`

- [ ] **Step 1 — Write the failing test (REAL).** Create `src/app/api/proyectos/[id]/publicar-disponibilidad/__tests__/revalidate.test.ts`. It mocks `next/cache` and asserts the helper calls `revalidateTag` for the slug. We test the shared helper contract (`revalidateProyecto`) the route relies on, so the test is deterministic and does not need a live Supabase:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  const revalidateTag = vi.fn();
  vi.mock("next/cache", () => ({ revalidateTag }));

  beforeEach(() => {
    revalidateTag.mockClear();
    vi.resetModules();
  });

  describe("publicar-disponibilidad revalidation contract", () => {
    it("revalidateProyecto invalidates the proyecto-<slug> tag", async () => {
      const { revalidateProyecto } = await import(
        "@/lib/supabase/cached-queries"
      );
      await revalidateProyecto("torre-norte");
      expect(revalidateTag).toHaveBeenCalledWith(
        "proyecto-torre-norte",
        expect.anything()
      );
    });

    it("route source calls revalidateProyecto for slug and subdomain", async () => {
      const fs = await import("node:fs");
      const src = fs.readFileSync(
        new URL("../route.ts", import.meta.url),
        "utf8"
      );
      // Guard against regression: the handler must revalidate after mutating the snapshot.
      expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.slug\s*\)/);
      expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.subdomain\s*\)/);
    });
  });
  ```

- [ ] **Step 2 — Run it (expect FAIL on the second test).**
  ```bash
  npm test -- src/app/api/proyectos/[id]/publicar-disponibilidad
  ```
  Expected: the first test passes; the second FAILS with something like `expected '…route source…' to match /revalidateProyecto\(\s*proyecto\.slug\s*\)/` because the route does not yet call the helper. Overall: `1 failed`.

- [ ] **Step 3 — Add the import (minimal impl, part 1).** At the top of `src/app/api/proyectos/[id]/publicar-disponibilidad/route.ts`, the current imports are:
  ```ts
  import { getAuthContext } from "@/lib/auth-context";
  import { NextRequest, NextResponse } from "next/server";
  ```
  Add the revalidate helper:
  ```ts
  import { getAuthContext } from "@/lib/auth-context";
  import { revalidateProyecto } from "@/lib/supabase/cached-queries";
  import { NextRequest, NextResponse } from "next/server";
  ```

- [ ] **Step 4 — Select slug + subdomain (minimal impl, part 2).** The ownership query currently is:
  ```ts
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, user_id")
      .eq("id", id)
      .single();
  ```
  Change the select to include the fields we need to revalidate:
  ```ts
    const { data: proyecto, error: projErr } = await auth.supabase
      .from("proyectos")
      .select("id, user_id, slug, subdomain")
      .eq("id", id)
      .single();
  ```

- [ ] **Step 5 — Revalidate after the snapshot update (minimal impl, part 3).** The success block currently is:
  ```ts
      if (updateErr) throw updateErr;

      return NextResponse.json({
        updated: true,
        unidades_count: (currentUnidades || []).length,
      });
  ```
  Insert the revalidation between them, mirroring `publicar/route.ts:145-148`:
  ```ts
      if (updateErr) throw updateErr;

      // Snapshot changed → invalidate the public microsite cache (slug + subdomain)
      await revalidateProyecto(proyecto.slug);
      if (proyecto.subdomain && proyecto.subdomain !== proyecto.slug) {
        await revalidateProyecto(proyecto.subdomain);
      }

      return NextResponse.json({
        updated: true,
        unidades_count: (currentUnidades || []).length,
      });
  ```

- [ ] **Step 6 — Run test (expect PASS).**
  ```bash
  npm test -- src/app/api/proyectos/[id]/publicar-disponibilidad
  ```
  Expected: `2 passed`, exit 0.

- [ ] **Step 7 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add "src/app/api/proyectos/[id]/publicar-disponibilidad/route.ts" "src/app/api/proyectos/[id]/publicar-disponibilidad/__tests__/revalidate.test.ts"
  git commit -m "fix: revalidate microsite cache after publishing availability"
  ```
  Expected: all green, commit created.

---

### Task 3: Revalidate microsite cache when a version is restored (`versiones/[versionId]/restaurar`)

`src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/route.ts` deletes and re-inserts every child table AND updates the `proyectos` row from an old snapshot, but never calls `revalidateProyecto`. After a restore, the live microsite keeps serving the previous cached snapshot for up to 1 h. Same class of bug as Task 2. The route currently selects only `id` on the ownership check, so add `slug, subdomain`.

**Files:**
- Modify: `src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/route.ts` (imports line 1-2; ownership select line ~16-21; revalidate before the final `return` at line ~170)
- Create test: `src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/__tests__/revalidate.test.ts`

- [ ] **Step 1 — Write the failing test (REAL).** Create `src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/__tests__/revalidate.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import fs from "node:fs";

  describe("restaurar revalidation contract", () => {
    const src = fs.readFileSync(
      new URL("../route.ts", import.meta.url),
      "utf8"
    );

    it("imports the revalidate helper", () => {
      expect(src).toMatch(
        /import\s*\{\s*revalidateProyecto\s*\}\s*from\s*["']@\/lib\/supabase\/cached-queries["']/
      );
    });

    it("revalidates slug and subdomain after restore", () => {
      expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.slug\s*\)/);
      expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.subdomain\s*\)/);
    });
  });
  ```

- [ ] **Step 2 — Run it (expect FAIL).**
  ```bash
  npm test -- src/app/api/proyectos/[id]/versiones/[versionId]/restaurar
  ```
  Expected: both tests FAIL (`expected … to match /import { revalidateProyecto }…/` and the slug matcher), because the route has no revalidation. Overall: `2 failed`.

- [ ] **Step 3 — Add the import (minimal impl, part 1).** Current top of file:
  ```ts
  import { getAuthContext, requirePermission } from "@/lib/auth-context";
  import { NextRequest, NextResponse } from "next/server";
  ```
  Change to:
  ```ts
  import { getAuthContext, requirePermission } from "@/lib/auth-context";
  import { revalidateProyecto } from "@/lib/supabase/cached-queries";
  import { NextRequest, NextResponse } from "next/server";
  ```

- [ ] **Step 4 — Select slug + subdomain (minimal impl, part 2).** Current ownership select:
  ```ts
      const { data: proyecto } = await auth.supabase
        .from("proyectos")
        .select("id")
        .eq("id", id)
        .eq("user_id", auth.adminUserId)
        .single();
  ```
  Change to:
  ```ts
      const { data: proyecto } = await auth.supabase
        .from("proyectos")
        .select("id, slug, subdomain")
        .eq("id", id)
        .eq("user_id", auth.adminUserId)
        .single();
  ```

- [ ] **Step 5 — Revalidate before the success return (minimal impl, part 3).** The end of the `try` block currently is:
  ```ts
      if (updateErr) throw updateErr;

      return NextResponse.json({ success: true });
  ```
  Change to:
  ```ts
      if (updateErr) throw updateErr;

      // Restored snapshot replaced live child data + project row → bust microsite cache
      await revalidateProyecto(proyecto.slug);
      if (proyecto.subdomain && proyecto.subdomain !== proyecto.slug) {
        await revalidateProyecto(proyecto.subdomain);
      }

      return NextResponse.json({ success: true });
  ```

- [ ] **Step 6 — Run test (expect PASS).**
  ```bash
  npm test -- src/app/api/proyectos/[id]/versiones/[versionId]/restaurar
  ```
  Expected: `2 passed`, exit 0.

- [ ] **Step 7 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add "src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/route.ts" "src/app/api/proyectos/[id]/versiones/[versionId]/restaurar/__tests__/revalidate.test.ts"
  git commit -m "fix: revalidate microsite cache after restoring a version"
  ```
  Expected: all green, commit created.

---

### Task 4: Confirm the `revalidateTag` invalidation semantics (Next.js 16)

> DECISION GATE: Choose the revalidation profile for the editor flow. Next.js 16 deprecated the single-arg `revalidateTag(tag)` and now takes `revalidateTag(tag, profile)` where `profile` is `"max"` (stale-while-revalidate: the next request still sees OLD data, fresh built in background) or `{ expire?: number }`. The repo currently uses `revalidateTag(tag, { expire: 0 })` (immediate expiry → next request is a blocking cache-miss → fresh data immediately). `updateTag` (true read-your-own-writes) is **not usable here** because these are Route Handlers, not Server Actions, and `updateTag` throws outside a Server Action.
> - **Branch A (KEEP `{ expire: 0 }`):** the editor expects "publish → open the public site → see the change now." `{ expire: 0 }` delivers that (blocking revalidate). This is the recommended default — only the documentation comment needs updating. Implement Step A.
> - **Branch B (SWITCH to `"max"`):** accept a brief window where the just-published site still shows the prior snapshot, traded for never blocking a public request on a cold rebuild. Implement Step B. Choose this ONLY if the owner prefers public-request latency over instant editor feedback.

**Files:**
- Modify: `src/lib/supabase/cached-queries.ts:36-37, 45-46`
- Create test: `src/lib/supabase/__tests__/revalidate-helpers.test.ts`

- [ ] **Step 1 — Write the test (REAL), asserting whichever profile the gate selects.** Create `src/lib/supabase/__tests__/revalidate-helpers.test.ts`. Default below asserts **Branch A** (`{ expire: 0 }`); if Branch B is chosen, change the second argument in both `expect` calls to `"max"`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  const revalidateTag = vi.fn();
  vi.mock("next/cache", () => ({ revalidateTag }));

  beforeEach(() => {
    revalidateTag.mockClear();
    vi.resetModules();
  });

  describe("cache revalidation helpers", () => {
    it("revalidateProyecto invalidates proyecto-<slug> with the chosen profile", async () => {
      const { revalidateProyecto } = await import("../cached-queries");
      await revalidateProyecto("torre-norte");
      // Branch A default. For Branch B, replace { expire: 0 } with "max".
      expect(revalidateTag).toHaveBeenCalledWith("proyecto-torre-norte", {
        expire: 0,
      });
    });

    it("revalidateAllProyectos invalidates the proyectos tag with the chosen profile", async () => {
      const { revalidateAllProyectos } = await import("../cached-queries");
      await revalidateAllProyectos();
      expect(revalidateTag).toHaveBeenCalledWith("proyectos", { expire: 0 });
    });
  });
  ```

- [ ] **Step 2 — Run it (expect PASS for Branch A as-is; FAIL for Branch B until Step B applied).**
  ```bash
  npm test -- src/lib/supabase/__tests__/revalidate-helpers.test.ts
  ```
  Expected (Branch A, no code change yet): `2 passed` — this test pins the CURRENT behavior so we don't regress it. Expected (Branch B): `2 failed` until Step B switches the code to `"max"`.

- [ ] **Step A (Branch A — KEEP `{ expire: 0 }`, only document).** In `src/lib/supabase/cached-queries.ts`, leave the calls as-is but make the intent explicit. Replace the `revalidateProyecto` body:
  ```ts
  export async function revalidateProyecto(slug: string) {
    const { revalidateTag } = await import("next/cache");
    revalidateTag(`proyecto-${slug}`, { expire: 0 });
  }
  ```
  with:
  ```ts
  export async function revalidateProyecto(slug: string) {
    const { revalidateTag } = await import("next/cache");
    // Next 16: { expire: 0 } = immediate blocking invalidation (the deprecated
    // single-arg behavior). Route Handlers cannot use updateTag (Server Action only),
    // and the editor expects the public site to reflect changes on the very next request.
    revalidateTag(`proyecto-${slug}`, { expire: 0 });
  }
  ```
  Apply the same one-line comment above the `revalidateTag("proyectos", { expire: 0 })` call in `revalidateAllProyectos`. (No behavior change; test from Step 1 still passes.)

- [ ] **Step B (Branch B — SWITCH to `"max"`).** Only if the gate chose B. In `revalidateProyecto`, change:
  ```ts
    revalidateTag(`proyecto-${slug}`, { expire: 0 });
  ```
  to:
  ```ts
    revalidateTag(`proyecto-${slug}`, "max");
  ```
  and in `revalidateAllProyectos` change `revalidateTag("proyectos", { expire: 0 })` to `revalidateTag("proyectos", "max")`. Then update the Step 1 test's two `expect` second arguments from `{ expire: 0 }` to `"max"` and re-run until `2 passed`.

- [ ] **Step 3 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/supabase/cached-queries.ts "src/lib/supabase/__tests__/revalidate-helpers.test.ts"
  git commit -m "chore: pin and document revalidateTag invalidation semantics for Next 16"
  ```
  Expected: all green, commit created. (Commit subject `chore:`; if Branch B changed runtime behavior, use `fix:` instead.)

---

### Task 5: Fix Vercel function runtime config for App Router PDF/image routes

`vercel.json` has `"functions": { "pages/api/**/*.ts": { "memory": 1024, "maxDuration": 60 } }`. The app is App Router — there is **no** `pages/api` directory (`src/app/api/**` only), so this glob matches zero functions and the heavy routes run on Vercel defaults. The reliable, portable fix is per-route `export const maxDuration` (App Router route segment config) on the PDF/image routes; we also correct the dead `vercel.json` glob to the App Router path so memory (1024 MB) is actually applied. Heavy routes confirmed importing `@react-pdf/renderer`/`sharp`: `cotizaciones/route.ts`, `cotizaciones/preview/route.ts`, `cotizaciones/[id]/regenerate/route.ts`, `unidades/export-pdf/route.ts`, `upload/route.ts`.

This is config, not unit-testable logic, so verification is `typecheck`/`lint` plus a grep assertion and a build-config sanity check.

**Files:**
- Modify: `src/app/api/cotizaciones/route.ts` (add segment config after imports, ~line 17)
- Modify: `src/app/api/cotizaciones/preview/route.ts`
- Modify: `src/app/api/cotizaciones/[id]/regenerate/route.ts`
- Modify: `src/app/api/unidades/export-pdf/route.ts`
- Modify: `src/app/api/upload/route.ts`
- Modify: `vercel.json:24-29` (correct the `functions` glob)

- [ ] **Step 1 — Add `maxDuration` to each heavy route.** Immediately after the import block of EACH of the five route files, add:
  ```ts
  // PDF/image generation is CPU- and memory-heavy; raise above the Vercel default.
  export const runtime = "nodejs";
  export const maxDuration = 60;
  ```
  Placement examples (insert after the last import line):
  - `src/app/api/cotizaciones/route.ts` — after the `getServiceClient` imports block (after line ~16, before `function getServiceClient()`); put the two exports right under the final `import … from "@/lib/plan-guard";` line.
  - `src/app/api/cotizaciones/preview/route.ts` — after its import block.
  - `src/app/api/cotizaciones/[id]/regenerate/route.ts` — after its import block.
  - `src/app/api/unidades/export-pdf/route.ts` — after its import block.
  - `src/app/api/upload/route.ts` — after its import block.
  If a file already declares `export const runtime` or `export const dynamic`, do NOT duplicate it — only add the line that is missing (these five currently declare neither; verify with `grep -n "export const runtime\|export const maxDuration" <file>` first).

- [ ] **Step 2 — Correct the dead `vercel.json` glob.** Current `vercel.json` `functions`:
  ```json
    "functions": {
      "pages/api/**/*.ts": {
        "memory": 1024,
        "maxDuration": 60
      }
    },
  ```
  Replace the key with the App Router source path Vercel matches for Next.js function config:
  ```json
    "functions": {
      "src/app/api/**/*.ts": {
        "memory": 1024,
        "maxDuration": 60
      }
    },
  ```
  Rationale: this restores the intended 1024 MB memory ceiling for API routes (in-route `maxDuration` cannot set memory). The per-route `maxDuration` from Step 1 and the `vercel.json` value agree at 60, so there is no conflict.

- [ ] **Step 3 — Write a config-guard test (REAL).** Create `src/app/api/__tests__/runtime-config.test.ts` so the runtime config can't silently regress:
  ```ts
  import { describe, it, expect } from "vitest";
  import fs from "node:fs";
  import path from "node:path";

  const ROUTES = [
    "cotizaciones/route.ts",
    "cotizaciones/preview/route.ts",
    "cotizaciones/[id]/regenerate/route.ts",
    "unidades/export-pdf/route.ts",
    "upload/route.ts",
  ];

  describe("heavy PDF/image routes declare extended maxDuration", () => {
    for (const rel of ROUTES) {
      it(`${rel} sets maxDuration`, () => {
        const src = fs.readFileSync(
          path.join(process.cwd(), "src/app/api", rel),
          "utf8"
        );
        expect(src).toMatch(/export const maxDuration\s*=\s*60/);
      });
    }

    it("vercel.json functions glob targets App Router, not pages/api", () => {
      const vercel = fs.readFileSync(
        path.join(process.cwd(), "vercel.json"),
        "utf8"
      );
      expect(vercel).toContain("src/app/api/**/*.ts");
      expect(vercel).not.toContain("pages/api/**/*.ts");
    });
  });
  ```

- [ ] **Step 4 — Run it (expect PASS after Steps 1–2).**
  ```bash
  npm test -- src/app/api/__tests__/runtime-config.test.ts
  ```
  Expected: `6 passed` (5 route assertions + 1 vercel.json assertion). If any route test fails, re-check that file got both export lines in Step 1.

- [ ] **Step 5 — Validate `vercel.json` is still valid JSON.**
  ```bash
  node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"
  ```
  Expected: `vercel.json OK`, exit 0.

- [ ] **Step 6 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add "src/app/api/cotizaciones/route.ts" "src/app/api/cotizaciones/preview/route.ts" "src/app/api/cotizaciones/[id]/regenerate/route.ts" "src/app/api/unidades/export-pdf/route.ts" "src/app/api/upload/route.ts" vercel.json "src/app/api/__tests__/runtime-config.test.ts"
  git commit -m "fix: set maxDuration on PDF/image routes and correct vercel.json glob for App Router"
  ```
  Expected: all green, commit created.

---

### Task 6: Bundle cotizador fonts for the availability-PDF route (`unidades/export-pdf`)

`src/app/api/unidades/export-pdf/route.ts` calls `registerFonts()` from `@/lib/cotizador/pdf-react/fonts`, which `fs.readFileSync`s the four `.ttf` files from `src/lib/cotizador/fonts/` at request time. `next.config.ts` `outputFileTracingIncludes` lists those fonts for `/api/cotizaciones`, `/api/cotizaciones/preview`, and `/api/cotizaciones/[id]/regenerate` — but NOT for `/api/unidades/export-pdf`. On Vercel that route's serverless bundle won't contain the fonts, so `registerFonts` logs `[react-pdf] font not found` and the availability PDF renders with fallback fonts. Add the missing trace entry. (Editing `next.config.ts` is config; verify with a parse + grep guard, no unit logic.)

**Files:**
- Modify: `next.config.ts:7-11` (the `outputFileTracingIncludes` object)
- Create test: extend `src/app/api/__tests__/runtime-config.test.ts` (from Task 5) with a tracing assertion, OR create `src/app/api/__tests__/font-tracing.test.ts` if Task 5's file already committed.

- [ ] **Step 1 — Add the trace entry.** Current `outputFileTracingIncludes`:
  ```ts
    outputFileTracingIncludes: {
      "/api/cotizaciones": ["./src/lib/cotizador/fonts/**/*"],
      "/api/cotizaciones/preview": ["./src/lib/cotizador/fonts/**/*"],
      "/api/cotizaciones/\\[id\\]/regenerate": ["./src/lib/cotizador/fonts/**/*"],
    },
  ```
  Add the availability-PDF route (it has no dynamic segment, so no escaping needed):
  ```ts
    outputFileTracingIncludes: {
      "/api/cotizaciones": ["./src/lib/cotizador/fonts/**/*"],
      "/api/cotizaciones/preview": ["./src/lib/cotizador/fonts/**/*"],
      "/api/cotizaciones/\\[id\\]/regenerate": ["./src/lib/cotizador/fonts/**/*"],
      "/api/unidades/export-pdf": ["./src/lib/cotizador/fonts/**/*"],
    },
  ```

- [ ] **Step 2 — Write the tracing-guard test (REAL).** Create `src/app/api/__tests__/font-tracing.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import fs from "node:fs";
  import path from "node:path";

  describe("serverless font tracing", () => {
    const cfg = fs.readFileSync(
      path.join(process.cwd(), "next.config.ts"),
      "utf8"
    );

    it("traces cotizador fonts into the availability-PDF route bundle", () => {
      expect(cfg).toMatch(/"\/api\/unidades\/export-pdf":\s*\[/);
    });

    it("the four font files exist on disk", () => {
      const dir = path.join(process.cwd(), "src/lib/cotizador/fonts");
      for (const f of [
        "cormorant-light.ttf",
        "syne-bold.ttf",
        "inter-regular.ttf",
        "dm-mono-regular.ttf",
      ]) {
        expect(fs.existsSync(path.join(dir, f))).toBe(true);
      }
    });
  });
  ```

- [ ] **Step 3 — Run it (expect PASS after Step 1).**
  ```bash
  npm test -- src/app/api/__tests__/font-tracing.test.ts
  ```
  Expected: `2 passed`, exit 0.

- [ ] **Step 4 — Confirm `next.config.ts` still type-checks (catches a malformed object literal).**
  ```bash
  npm run typecheck
  ```
  Expected: exit 0, no errors referencing `next.config.ts`.

- [ ] **Step 5 — Verify gate + commit.**
  ```bash
  npm run typecheck && npm run lint && npm test
  git add next.config.ts "src/app/api/__tests__/font-tracing.test.ts"
  git commit -m "fix: include cotizador fonts in serverless bundle for availability PDF export"
  ```
  Expected: all green, commit created.

---

### Task 7: Untrack root debug artifacts and ignore them going forward (repo cleanup)

The repo root tracks debug junk that should never be in source control: six test PDFs (`test-cotizacion*.pdf`, `test-cotizacion-v2.pdf`, `test-output.pdf`), five QA scripts (`qa-auth.py`, `qa-editor.py`, `qa-editor-v2.py`, `qa-final.py`, `qa-recon.py`), and 55 tracked screenshots under `qa-screenshots/`. `.gitignore` already ignores `.temp/` but none of these. Untrack them (keep on disk) and add ignore rules so they don't get re-added. No unit test; verification is `git` state.

**Files:**
- Modify: `.gitignore` (append a "local QA artifacts" block)
- Untrack (no delete from disk): the 6 PDFs, 5 `qa-*.py`, and `qa-screenshots/`

- [ ] **Step 1 — Append ignore rules to `.gitignore`.** Add at the end of `.gitignore` (after the `# sentry` block):
  ```gitignore

  # local QA / debug artifacts (never commit)
  /qa-screenshots/
  /qa-*.py
  /test-*.pdf
  /test-output.pdf
  ```

- [ ] **Step 2 — Untrack the files but keep them on disk.** `git rm --cached` removes from the index without deleting working-tree files:
  ```bash
  git rm --cached test-cotizacion-1775594814024.pdf test-cotizacion-1775595226763.pdf test-cotizacion-1775595406214.pdf test-cotizacion-v2.pdf test-cotizacion.pdf test-output.pdf
  git rm --cached qa-auth.py qa-editor.py qa-editor-v2.py qa-final.py qa-recon.py
  git rm -r --cached qa-screenshots
  ```
  Expected: `rm 'test-cotizacion.pdf'` etc. for each, and `rm 'qa-screenshots/01-login.png'` … (55 entries). Files remain present on disk (`ls test-cotizacion.pdf` still succeeds).

- [ ] **Step 3 — Confirm they're now ignored and no longer tracked.**
  ```bash
  git ls-files | grep -E '^(test-.*\.pdf|test-output\.pdf|qa-.*\.py|qa-screenshots/)' || echo "NONE tracked — good"
  git check-ignore -q qa-screenshots/01-login.png test-output.pdf qa-recon.py && echo "ignore rules active"
  ```
  Expected: first command prints `NONE tracked — good`; second prints `ignore rules active`.

- [ ] **Step 4 — Sanity: working tree only shows the intended deletions + .gitignore.**
  ```bash
  git status --short
  ```
  Expected: a block of `D` (deleted-from-index) lines for the untracked artifacts plus `M .gitignore`. No source files touched.

- [ ] **Step 5 — Verify gate + commit.** (typecheck/lint/test still relevant — confirm nothing else drifted.)
  ```bash
  npm run typecheck && npm run lint && npm test
  git add .gitignore
  git commit -m "chore: untrack root QA/debug artifacts and ignore them"
  ```
  Expected: all green; commit includes `.gitignore` modification and the index removals staged by `git rm --cached`.

---

### Task 8: Final full-suite verification

**Files:** none (verification only).

- [ ] **Step 1 — Run the whole verify gate clean.**
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: typecheck exit 0; lint exit 0 (warnings allowed, no errors); vitest `Test Files  <n> passed`, all suites green.

- [ ] **Step 2 — Confirm the branch is ahead of `dev` with the expected commits.**
  ```bash
  git log --oneline dev..HEAD
  ```
  Expected (order may vary): the `test:` vitest commit, two `fix:` revalidation commits, the `chore:` revalidateTag-semantics commit, the `fix:` maxDuration/vercel.json commit, the `fix:` font-tracing commit, and the `chore:` cleanup commit.

- [ ] **Step 3 — Push the branch (preview only; NEVER `main`).**
  ```bash
  git push -u origin fix/infra-cache-cleanup
  ```
  Expected: branch pushed; Vercel builds a free preview. Do not merge to `main` without explicit owner approval (WORKFLOW.md).

---

## Task dependency / order

- **Task 1 (Vitest) is the hard prerequisite** for the TDD steps in Tasks 2, 3, 4, 5, 6 (they call `npm test`). Do it first.
- **Tasks 2 and 3** (the two revalidation gaps) are independent of each other and of 5/6 — they can be done in any order after Task 1. These are the highest-impact correctness fixes (stale public microsites).
- **Task 4** depends on the **DECISION GATE** (revalidateTag profile). It is independent of 2/3/5/6; it can proceed the moment the owner picks Branch A (default, no behavior change) or Branch B. If undecided, Branch A is safe to ship as-is (it pins current behavior).
- **Tasks 5 and 6** both touch infra/config for the PDF routes and are independent of the cache tasks; do them together if convenient (5 before 6 so the shared `src/app/api/__tests__/` dir exists, though 6 creates its own file if needed).
- **Task 7** (cleanup) is fully independent — can be done any time after Task 1.
- **Task 8** runs last.

## Per-task effort estimate

| Task | Scope | Estimate |
|------|-------|----------|
| 1 | Vitest install + config + smoke test | 0.5 d |
| 2 | publicar-disponibilidad revalidation + test | 0.5 d |
| 3 | restaurar revalidation + test | 0.5 d |
| 4 | revalidateTag semantics (gated) + test | 0.25 d |
| 5 | maxDuration on 5 routes + vercel.json + test | 0.5 d |
| 6 | font tracing for export-pdf + test | 0.25 d |
| 7 | untrack QA/debug artifacts + .gitignore | 0.25 d |
| 8 | full-suite verification + push | 0.25 d |
| **Total** | | **~3 d** |
