# Plan-gating sync + billing model + pricing taxonomy Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. ALL work happens on a `fix/plan-billing` branch cut off `dev` — NEVER push to `main` (production = noddo.io) without explicit owner approval (WORKFLOW.md). Use conventional commit prefixes (`fix:` / `refactor:` / `feat:` / `test:` / `chore:`). Run the verify gate `npm run typecheck && npm run lint` (and `npm test` once vitest exists, Task 1) before EVERY commit.

**Goal:** Make plan gating a single, internally-consistent source of truth whose taxonomy/prices match `PRICING.md`, whose backfill migration no longer silently upgrades every project to Pro, and whose public-microsite cotizador enablement is *derived from* the project plan instead of drifting out of sync with it.

**Architecture:** We harden `src/lib/plan-config.ts` as the ONE source of truth (taxonomy, prices, storage, limits, locked-feature derivation) and delete the duplicated/contradictory price+limit literals scattered across `plan-limits.ts`, `ghl-config.ts`, the admin route, the marketing i18n, and `PRICING.md`. We add a pure `isCotizadorEnabledForPlan()` derivation so the public microsite and the publish snapshot both compute cotizador visibility from `plan` (not from a free-floating `cotizador_enabled` boolean). We introduce vitest (none exists today) and drive every code change TDD-first. A new corrective migration fixes the production backfill bug and re-syncs `cotizador_enabled` to `plan` so already-corrupted rows are healed; the admin plan-change route is updated to keep `cotizador_enabled` in lockstep with `plan` going forward.

**Tech Stack:** TypeScript (strict), Next.js 16 App Router route handlers, Supabase Postgres (`supabase db push` via `npm run db:migrate`), vitest (new), `@supabase/supabase-js` types, React Query / React context (existing `usePlanGate`).

---

> DECISION GATE (applies to Task 2, Task 3, Task 6): **What is the canonical plan taxonomy + price table?** Two coherent options exist in the repo, and they conflict. Plan BOTH below; pick one before executing Task 2.
>
> **Option A — "Keep the code's 2-tier `basico`/`pro` model" (RECOMMENDED, lowest blast radius).** Canonical tiers = `basico` (self-serve) + `pro` (self-serve) + `enterprise` (sales-only, not selectable in-app). Prices = the ones already live in code + marketing + GHL: **basico $199/mo, pro $249/mo, enterprise custom**. This means **`PRICING.md` is the wrong artifact** (its `$79`/`$149` Esencial/Profesional table is stale) and gets rewritten to match. Labels stay "Básico"/"Pro"/"Enterprise". This is the default assumed by every concrete code block below.
>
> **Option B — "Adopt `PRICING.md`'s `Esencial`/`Profesional` model".** Canonical tiers = `esencial` ($79/mo, 1 project, no cotizador) + `profesional` ($149/mo, 5 projects, cotizador) + `enterprise` (custom). This requires a **slug rename** (`basico`→`esencial`, `pro`→`profesional`) touching: the `proyectos.plan` CHECK constraint + every row, `user_plans`/`payments` constraints, `plan-config.ts` `PROJECT_PLANS`, `plan-limits.ts`, `ghl-config.ts` `PLAN_VALUES`, marketing i18n keys (`basicoName`→`esencialName` etc.), `gtag`/GHL tag values (`plan-basico`→`plan-esencial`), and the `Proyecto.plan` union type. Where a code block below says `"basico"`/`"pro"`, substitute `"esencial"`/`"profesional"` and use prices `79`/`149`; where a migration backfills, add the slug-rename `UPDATE`s shown in Task 2 Option-B sub-steps.
>
> Until the gate is decided, Task 1 (vitest setup) and Task 5 (sync-derivation logic, which is taxonomy-agnostic) can proceed. Tasks 2/3/4/6 are blocked on the decision.

---

### Task 1: Stand up vitest (test runner does not exist yet)

No unit test runner is configured (`package.json` has only `test:e2e` Playwright; `grep vitest package.json` → exit 1). Every later task is TDD, so this comes first.

**Files:**
- Modify: `package.json:6` (scripts block — add `test`/`test:run`)
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/smoke.test.ts` (throwaway, proves the runner works; deleted in Task 2)

- [ ] **Step 1: Add the failing smoke test FIRST**

Create `src/lib/__tests__/smoke.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest smoke", () => {
  it("runs and resolves the @/ alias", async () => {
    const mod = await import("@/lib/plan-config");
    expect(mod.PROJECT_PLANS).toContain("basico");
  });
});
```

- [ ] **Step 2: Run it — expect FAIL (no runner / no config yet)**

```bash
npm test
```

Expected output (FAIL): npm errors with `Missing script: "test"` (the `test` script does not exist yet).

- [ ] **Step 3: Install vitest + add config + scripts (minimal implementation)**

```bash
npm install -D vitest@^3 vite-tsconfig-paths@^5
```

(`.npmrc` already has `legacy-peer-deps=true`, so peer-dep resolution will not block.)

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    globals: false,
  },
});
```

Add to `package.json` scripts (after the `"lint": "eslint",` line):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 4: Run it — expect PASS**

```bash
npm test
```

Expected output (PASS): `✓ src/lib/__tests__/smoke.test.ts (1 test)` and `Test Files  1 passed (1)`.

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck exits 0, lint exits 0 (no errors), test suite passes.

```bash
git add package.json package-lock.json vitest.config.ts src/lib/__tests__/smoke.test.ts
git commit -m "test: add vitest runner with tsconfig path resolution"
```

---

### Task 2: Make `plan-config.ts` the single source of truth (taxonomy, prices, storage, limits)

> DECISION GATE: see top-of-file gate. Code below assumes **Option A** (`basico` $199 / `pro` $249 / `enterprise` custom). For Option B, substitute slugs `esencial`/`profesional` and prices `79`/`149` throughout this task and add the rename `UPDATE`s in Task 2-DB (Step 7).

Today there are FOUR contradictory price/limit definitions:
- `plan-config.ts` → basico $199 / pro $249, storage 10/50GB, collaborators 3/10
- `plan-limits.ts` → adds `enterprise`, `PLAN_DEFAULTS` with max_projects 1/5/50, max_units 200/500/2000; doc-comment still says `$79`
- `ghl-config.ts` `PLAN_VALUES` → basico 199 / pro 249 / personalizado 0
- `PRICING.md` → $79/$149, different slugs entirely

We fold project-level numeric limits (`max_projects`, `max_units_per_project`) INTO `plan-config.ts` so there is exactly one table, then re-export from `plan-limits.ts` for back-compat.

**Files:**
- Modify: `src/lib/plan-config.ts:48` (extend `PlanTierConfig`), `:65` (extend `PLAN_TIERS`), add `enterprise` tier + `PLAN_PRICES` export
- Modify: `src/lib/plan-limits.ts:16` (derive `PLAN_DEFAULTS` from `PLAN_TIERS` instead of redefining)
- Modify: `src/lib/ghl-config.ts:77` (derive `PLAN_VALUES` from `PLAN_TIERS`)
- Test: `src/lib/__tests__/plan-config.test.ts`
- Delete: `src/lib/__tests__/smoke.test.ts` (replaced)

- [ ] **Step 1: Replace the smoke test with the real failing test**

Delete `src/lib/__tests__/smoke.test.ts` and create `src/lib/__tests__/plan-config.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  PLAN_TIERS,
  PROJECT_PLANS,
  getPlanTier,
  isFeatureAvailable,
  getLockedFeatures,
} from "@/lib/plan-config";
import { PLAN_DEFAULTS } from "@/lib/plan-limits";
import { PLAN_VALUES } from "@/lib/ghl-config";

describe("plan-config single source of truth", () => {
  it("exposes exactly basico + pro as self-serve project plans", () => {
    expect([...PROJECT_PLANS]).toEqual(["basico", "pro"]);
  });

  it("carries project-level numeric limits on every tier", () => {
    expect(PLAN_TIERS.basico.max_projects).toBe(1);
    expect(PLAN_TIERS.basico.max_units_per_project).toBe(200);
    expect(PLAN_TIERS.pro.max_projects).toBe(5);
    expect(PLAN_TIERS.pro.max_units_per_project).toBe(500);
  });

  it("derives plan-limits PLAN_DEFAULTS from the same table (no drift)", () => {
    expect(PLAN_DEFAULTS.basico.max_projects).toBe(PLAN_TIERS.basico.max_projects);
    expect(PLAN_DEFAULTS.pro.max_collaborators).toBe(PLAN_TIERS.pro.max_collaborators);
  });

  it("derives GHL PLAN_VALUES from the same prices (no drift)", () => {
    expect(PLAN_VALUES.basico).toBe(PLAN_TIERS.basico.price);
    expect(PLAN_VALUES.pro).toBe(PLAN_TIERS.pro.price);
    expect(PLAN_VALUES.personalizado).toBe(0);
  });

  it("locks all gated features on basico and none on pro", () => {
    expect(getLockedFeatures("basico")).toEqual([
      "cotizador",
      "correos_branded",
      "estadisticas_avanzadas",
    ]);
    expect(getLockedFeatures("pro")).toEqual([]);
    expect(isFeatureAvailable("pro", "cotizador")).toBe(true);
    expect(isFeatureAvailable("basico", "cotizador")).toBe(false);
  });

  it("falls back to basico tier for unknown plan", () => {
    // @ts-expect-error testing runtime fallback
    expect(getPlanTier("nonsense")).toBe(PLAN_TIERS.basico);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
npm test src/lib/__tests__/plan-config.test.ts
```

Expected output (FAIL): assertions on `PLAN_TIERS.basico.max_projects` / `max_units_per_project` fail with `expected undefined to be 1` (those fields do not exist yet), and the `PLAN_DEFAULTS`/`PLAN_VALUES` derivation tests pass only by coincidence of the current literals.

- [ ] **Step 3: Extend `PlanTierConfig` + `PLAN_TIERS` in `plan-config.ts` (minimal implementation)**

In `src/lib/plan-config.ts`, replace the `PlanTierConfig` interface (lines 48–55):

```ts
export interface PlanTierConfig {
  name: { es: string; en: string };
  price: number;            // USD/month per project (0 = custom/sales-only)
  currency: "USD";
  features: ReadonlySet<GatedFeature>;
  storage_bytes: number;
  max_collaborators: number;
  max_projects: number;
  max_units_per_project: number;
}
```

Replace the `PLAN_TIERS` object (lines 65–82) with the two self-serve tiers carrying the new fields:

```ts
export const PLAN_TIERS: Record<ProjectPlan, PlanTierConfig> = {
  basico: {
    name: { es: "Básico", en: "Basic" },
    price: 199,
    currency: "USD",
    features: BASICO_FEATURES,
    storage_bytes: 10 * 1024 ** 3,  // 10 GB
    max_collaborators: 3,
    max_projects: 1,
    max_units_per_project: 200,
  },
  pro: {
    name: { es: "Pro", en: "Pro" },
    price: 249,
    currency: "USD",
    features: PRO_FEATURES,
    storage_bytes: 50 * 1024 ** 3,  // 50 GB
    max_collaborators: 10,
    max_projects: 5,
    max_units_per_project: 500,
  },
};
```

Immediately after `PLAN_TIERS`, add an enterprise constant (sales-only; not in `ProjectPlan` so it can never be assigned to a project) plus a flat price map for the marketing/GHL layer:

```ts
/** Sales-only tier — never assigned to a project; used by admin/billing UIs only. */
export const ENTERPRISE_TIER: PlanTierConfig = {
  name: { es: "Enterprise", en: "Enterprise" },
  price: 0,  // custom / contact sales
  currency: "USD",
  features: PRO_FEATURES,
  storage_bytes: 500 * 1024 ** 3,  // 500 GB
  max_collaborators: 20,
  max_projects: 50,
  max_units_per_project: 2000,
};

/** Flat price map keyed by marketing/GHL slug (personalizado === enterprise sales tier). */
export const PLAN_PRICES: Record<"basico" | "pro" | "personalizado", number> = {
  basico: PLAN_TIERS.basico.price,
  pro: PLAN_TIERS.pro.price,
  personalizado: ENTERPRISE_TIER.price,  // 0 = custom
};
```

- [ ] **Step 4: Derive `PLAN_DEFAULTS` from `PLAN_TIERS` in `plan-limits.ts`**

In `src/lib/plan-limits.ts`, replace the hand-written `PLAN_DEFAULTS` (lines 16–24):

```ts
export const PLAN_DEFAULTS: Record<PlanType, {
  max_projects: number;
  max_units_per_project: number;
  max_collaborators: number;
}> = {
  basico: {
    max_projects: PLAN_TIERS.basico.max_projects,
    max_units_per_project: PLAN_TIERS.basico.max_units_per_project,
    max_collaborators: PLAN_TIERS.basico.max_collaborators,
  },
  pro: {
    max_projects: PLAN_TIERS.pro.max_projects,
    max_units_per_project: PLAN_TIERS.pro.max_units_per_project,
    max_collaborators: PLAN_TIERS.pro.max_collaborators,
  },
  enterprise: {
    max_projects: ENTERPRISE_TIER.max_projects,
    max_units_per_project: ENTERPRISE_TIER.max_units_per_project,
    max_collaborators: ENTERPRISE_TIER.max_collaborators,
  },
};
```

Update the import at the top of `plan-limits.ts` (line 8) to pull in `ENTERPRISE_TIER`:

```ts
import { PROJECT_PLANS, PLAN_TIERS, ENTERPRISE_TIER, type ProjectPlan } from "./plan-config";
```

- [ ] **Step 5: Derive `PLAN_VALUES` from `PLAN_PRICES` in `ghl-config.ts`**

In `src/lib/ghl-config.ts`, replace the `PLAN_VALUES` literal (lines 77–81):

```ts
import { PLAN_PRICES } from "./plan-config";

// ─── Plan values (USD/month per project) ────────────────────────────────
export const PLAN_VALUES: Record<string, number> = {
  basico: PLAN_PRICES.basico,
  pro: PLAN_PRICES.pro,
  personalizado: PLAN_PRICES.personalizado,
};
```

(Place the `import` with the other imports at the top of the file; `ghl-config.ts` currently has no imports, so add it as the first line.)

- [ ] **Step 6: Run the test — expect PASS**

```bash
npm test src/lib/__tests__/plan-config.test.ts
```

Expected output (PASS): all 6 assertions pass; `Test Files  1 passed (1)`.

- [ ] **Step 7: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: 0 errors; full suite green.

```bash
git add src/lib/plan-config.ts src/lib/plan-limits.ts src/lib/ghl-config.ts src/lib/__tests__/plan-config.test.ts
git rm src/lib/__tests__/smoke.test.ts
git commit -m "refactor: make plan-config.ts the single source of truth for plan prices and limits"
```

---

### Task 3: Fix the production backfill bug + heal corrupted rows (corrective migration)

> DECISION GATE: see top-of-file gate. Option A code below. For Option B add the slug-rename `UPDATE`s noted inline.

`supabase/migrations/20260715000000_plan_basico_pro.sql:13` runs `UPDATE proyectos SET plan = 'pro' WHERE plan = 'basico'` immediately after `ADD COLUMN ... DEFAULT 'basico'`. Because every freshly-added row is `basico`, this flips **100% of projects to `pro`**, silently disabling all plan gating in production. We do NOT edit the already-applied migration (it has run; rewriting history breaks `supabase db push`). We add a NEW corrective migration that (a) documents the bug, (b) is idempotent, and (c) leaves a deliberate, owner-driven path to re-tier projects. We also re-sync `cotizador_enabled` to plan (the `20260626000000_cotizador_auto_enable.sql` migration set it `true` for any project with a config, ignoring plan).

**Files:**
- Create: `supabase/migrations/20260626120000_fix_plan_backfill_and_cotizador_sync.sql`
- Verify (read-only): `supabase/migrations/20260715000000_plan_basico_pro.sql:13`, `supabase/migrations/20260626000000_cotizador_auto_enable.sql`

> DECISION GATE inside this task: **Should the heal DOWN-tier existing `pro` projects to `basico`?** The corrupted backfill made everyone `pro`. Two branches:
> - **Branch 3-KEEP (safe default):** Do NOT auto-downgrade. Leave existing projects `pro` (they keep features). Only fix forward: new projects default `basico`, and `cotizador_enabled` is re-synced to whatever each project's *current* plan is. This is non-destructive and what the SQL below does.
> - **Branch 3-RESET:** Owner wants real gating enforced retroactively → run the optional `UPDATE proyectos SET plan = 'basico' WHERE id IN (<owner-supplied list>)`. This is commented out in the migration; owner fills the id list. Do NOT run a blanket downgrade — it would strip paying Pro customers.

- [ ] **Step 1: Create the corrective migration**

Create `supabase/migrations/20260626120000_fix_plan_backfill_and_cotizador_sync.sql`:

```sql
-- ============================================
-- Fix: plan backfill bug + cotizador/plan sync
-- ============================================
-- Context:
--   Migration 20260715000000_plan_basico_pro.sql line 13 ran
--     UPDATE proyectos SET plan = 'pro' WHERE plan = 'basico';
--   immediately after adding the column with DEFAULT 'basico', so EVERY
--   project was flipped to 'pro', disabling plan gating in production.
--   Migration 20260626000000_cotizador_auto_enable.sql set cotizador_enabled = true
--   for any project with a config, ignoring plan.
--
-- This migration is non-destructive: it re-syncs cotizador_enabled to the
-- CURRENT plan and storage_limit_bytes to the CURRENT plan, so the feature
-- flag can never again disagree with the plan. It does NOT auto-downgrade
-- paying Pro projects (see Branch 3-RESET below).

-- Step 1: cotizador_enabled must agree with plan.
--   basico => cotizador OFF (gated feature not in plan)
--   pro    => cotizador ON only if a config exists (nothing to quote without config)
UPDATE proyectos
SET cotizador_enabled = false
WHERE plan = 'basico' AND cotizador_enabled = true;

UPDATE proyectos
SET cotizador_enabled = (cotizador_config IS NOT NULL)
WHERE plan = 'pro';

-- Step 2: storage_limit_bytes must agree with plan.
UPDATE proyectos
SET storage_limit_bytes = CASE
  WHEN plan = 'basico' THEN 10737418240   -- 10 GB
  WHEN plan = 'pro'    THEN 53687091200   -- 50 GB
  ELSE storage_limit_bytes
END;

-- Step 3 (Branch 3-RESET — owner-driven, OFF by default):
--   To retroactively enforce gating on specific projects, uncomment and fill
--   the id list, then re-run cotizador re-sync. DO NOT run a blanket downgrade.
-- UPDATE proyectos SET plan = 'basico'
--   WHERE id IN ('<uuid-1>', '<uuid-2>');
-- UPDATE proyectos SET cotizador_enabled = false WHERE plan = 'basico';

-- Fix the column comment installed by 20260715000000 (price was wrong/ambiguous).
COMMENT ON COLUMN proyectos.plan IS
  'Project plan tier: basico ($199/mo) or pro ($249/mo). Single source of truth: src/lib/plan-config.ts. Controls feature access; cotizador_enabled is kept in sync with this column.';
```

> Option B note: prepend two `UPDATE proyectos SET plan = 'esencial' WHERE plan = 'basico';` / `... 'profesional' WHERE plan = 'pro';` statements AND swap the CHECK constraint in a separate `ALTER TABLE proyectos DROP CONSTRAINT ... ADD CONSTRAINT ... CHECK (plan IN ('esencial','profesional'))` before the syncs, and replace the slug literals in Steps 1–3.

- [ ] **Step 2: Apply the migration to the dev/preview database**

```bash
npm run db:migrate
```

Expected output: `supabase db push` reports `Applying migration 20260626120000_fix_plan_backfill_and_cotizador_sync.sql...` and finishes with `Finished supabase db push.` (no errors).

- [ ] **Step 3: Verify the invariant holds (SQL check)**

Run via the Supabase SQL editor / `supabase` CLI against the dev DB:

```sql
-- Expect ZERO rows: no basico project may have cotizador enabled.
SELECT id, plan, cotizador_enabled
FROM proyectos
WHERE plan = 'basico' AND cotizador_enabled = true;

-- Expect ZERO rows: no pro project with a config may have cotizador disabled.
SELECT id, plan, cotizador_enabled, (cotizador_config IS NOT NULL) AS has_cfg
FROM proyectos
WHERE plan = 'pro' AND cotizador_config IS NOT NULL AND cotizador_enabled = false;

-- Expect ZERO rows: storage must match plan.
SELECT id, plan, storage_limit_bytes
FROM proyectos
WHERE (plan = 'basico' AND storage_limit_bytes <> 10737418240)
   OR (plan = 'pro'    AND storage_limit_bytes <> 53687091200);
```

Expected: all three queries return 0 rows.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260626120000_fix_plan_backfill_and_cotizador_sync.sql
git commit -m "fix: re-sync cotizador_enabled and storage to plan; document plan backfill bug"
```

---

### Task 4: Keep `cotizador_enabled` in lockstep when an admin changes a plan

`src/app/api/admin/proyectos/[id]/route.ts:31-35` updates `plan` and `storage_limit_bytes` but never `cotizador_enabled`. Downgrading `pro → basico` therefore leaves `cotizador_enabled = true` (and the public snapshot button visible) while `POST /api/cotizaciones` starts 403-ing via `requireFeature` — a broken, confusing state. We make the route the single write-path that enforces the same invariant the migration just established.

**Files:**
- Modify: `src/app/api/admin/proyectos/[id]/route.ts:29` (extend `updates` typing), `:31-35` (sync cotizador on plan change)
- Test: `src/lib/__tests__/plan-sync.test.ts` (pure helper extracted from the route)
- Modify: `src/lib/plan-config.ts` (add `isCotizadorEnabledForPlan` helper, reused by route + Task 5)

- [ ] **Step 1: Write the failing test for the derivation helper**

Create `src/lib/__tests__/plan-sync.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isCotizadorEnabledForPlan } from "@/lib/plan-config";

describe("isCotizadorEnabledForPlan", () => {
  it("is always false on basico, regardless of config", () => {
    expect(isCotizadorEnabledForPlan("basico", true)).toBe(false);
    expect(isCotizadorEnabledForPlan("basico", false)).toBe(false);
  });

  it("on pro, mirrors whether a config exists", () => {
    expect(isCotizadorEnabledForPlan("pro", true)).toBe(true);
    expect(isCotizadorEnabledForPlan("pro", false)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
npm test src/lib/__tests__/plan-sync.test.ts
```

Expected output (FAIL): `isCotizadorEnabledForPlan is not a function` / import resolves to `undefined` (the export does not exist yet).

- [ ] **Step 3: Add the helper to `plan-config.ts` (minimal implementation)**

Append to `src/lib/plan-config.ts` (after `getPlanTier`):

```ts
/**
 * Derive whether the public cotizador should be enabled for a project,
 * given its plan and whether a cotizador_config is present.
 * The cotizador is a gated ("cotizador") feature: it can only be on when the
 * plan includes it AND there is a config to quote from. This is the ONE rule
 * used by the admin write-path, the publish snapshot, and the public microsite.
 */
export function isCotizadorEnabledForPlan(
  plan: ProjectPlan,
  hasConfig: boolean
): boolean {
  return isFeatureAvailable(plan, "cotizador") && hasConfig;
}
```

- [ ] **Step 4: Run it — expect PASS**

```bash
npm test src/lib/__tests__/plan-sync.test.ts
```

Expected output (PASS): both tests green.

- [ ] **Step 5: Wire the helper into the admin route**

In `src/app/api/admin/proyectos/[id]/route.ts`, add the import (after line 3):

```ts
import { isCotizadorEnabledForPlan } from "@/lib/plan-config";
import type { ProjectPlan } from "@/lib/plan-config";
```

Widen the `updates` map typing (line 29) to allow a boolean:

```ts
  const updates: Record<string, string | number | boolean> = {};
```

Replace the plan branch (lines 31–35) so it also re-syncs `cotizador_enabled` from the project's current `cotizador_config`:

```ts
  if (body.plan !== undefined) {
    updates.plan = body.plan;
    // Update storage limit based on new plan
    updates.storage_limit_bytes = body.plan === "pro" ? 53687091200 : 10737418240; // 50GB : 10GB
    // Keep the public cotizador flag in lockstep with the plan (see plan-config.ts).
    const { data: current } = await admin
      .from("proyectos")
      .select("cotizador_config")
      .eq("id", id)
      .single();
    updates.cotizador_enabled = isCotizadorEnabledForPlan(
      body.plan as ProjectPlan,
      current?.cotizador_config != null
    );
  }
```

- [ ] **Step 6: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: 0 errors; full suite green (smoke gone, `plan-config` + `plan-sync` tests pass).

```bash
git add src/app/api/admin/proyectos/[id]/route.ts src/lib/plan-config.ts src/lib/__tests__/plan-sync.test.ts
git commit -m "fix: sync cotizador_enabled to plan on admin plan change"
```

---

### Task 5: Derive cotizador visibility from plan in the publish snapshot (close the sync gap)

`src/app/api/proyectos/[id]/publicar/route.ts:93` builds `snapshot.proyecto = proyecto` (a raw `select("*")`), so the public microsite reads `proyecto.cotizador_enabled` straight from whatever was in the row at publish time — it is NOT re-derived from `plan`. The public pages (`tipologias/page.tsx:1574`, `inventario/page.tsx:1388`, `explorar/page.tsx:1255`, `SiteLayoutClient.tsx:104`) all key off `proyecto.cotizador_enabled` + `proyecto.cotizador_config`. The only real gate is the server-side `requireFeature` on `POST /api/cotizaciones` (which checks the LIVE plan). Result: a stale snapshot can show the cotizador button to buyers of a basico project, who then hit a 403. We make the snapshot authoritative by deriving the flag from `plan` at publish time, using the SAME helper from Task 4.

**Files:**
- Modify: `src/app/api/proyectos/[id]/publicar/route.ts:1-4` (import), `:92-110` (override `proyecto.cotizador_enabled` in snapshot)
- Test: `src/lib/__tests__/snapshot-cotizador.test.ts` (pure builder extracted)
- Modify: `src/app/api/proyectos/[id]/publicar/route.ts` (extract a tiny pure `buildSnapshotProyecto` so it is unit-testable)

- [ ] **Step 1: Write the failing test for the snapshot derivation**

Create `src/lib/__tests__/snapshot-cotizador.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isCotizadorEnabledForPlan } from "@/lib/plan-config";

// Mirrors the snapshot override applied in publicar/route.ts.
function snapshotCotizadorFlag(proyecto: {
  plan: "basico" | "pro";
  cotizador_config: unknown;
  cotizador_enabled: boolean;
}): boolean {
  return isCotizadorEnabledForPlan(proyecto.plan, proyecto.cotizador_config != null);
}

describe("publish snapshot cotizador flag", () => {
  it("forces OFF for a basico project even if the row says enabled", () => {
    expect(
      snapshotCotizadorFlag({ plan: "basico", cotizador_config: {}, cotizador_enabled: true })
    ).toBe(false);
  });

  it("stays ON for a pro project with config", () => {
    expect(
      snapshotCotizadorFlag({ plan: "pro", cotizador_config: {}, cotizador_enabled: true })
    ).toBe(true);
  });

  it("is OFF for a pro project with no config", () => {
    expect(
      snapshotCotizadorFlag({ plan: "pro", cotizador_config: null, cotizador_enabled: true })
    ).toBe(false);
  });
});
```

- [ ] **Step 2: Run it — expect FAIL**

```bash
npm test src/lib/__tests__/snapshot-cotizador.test.ts
```

Expected output (FAIL): the first assertion fails — until Task 4's `isCotizadorEnabledForPlan` is in place this throws; if Task 4 already landed, the test passes for the helper but the ROUTE is still not using it (the route fix in Step 3 is what closes the real gap; this test guards the rule the route must follow).

> Note: this test pins the *rule*. The route change in Step 3 is verified manually in Step 4 because the publish route requires an authenticated Supabase context that is not unit-mockable here without heavy fixtures (the repo has no route-handler test harness today).

- [ ] **Step 3: Override the flag in the snapshot builder**

In `src/app/api/proyectos/[id]/publicar/route.ts`, add the import near the top (with the other `@/lib` imports, after line 3):

```ts
import { isCotizadorEnabledForPlan, type ProjectPlan } from "@/lib/plan-config";
```

Replace the snapshot `proyecto` field (line 94, `proyecto,` inside the `const snapshot = { ... }`) so the published copy carries a plan-derived flag instead of the raw DB value:

```ts
    // 3. Build snapshot
    const snapshotProyecto = {
      ...proyecto,
      // Derive cotizador visibility from plan so the public snapshot can never
      // show a gated feature out of sync with billing (see plan-config.ts).
      cotizador_enabled: isCotizadorEnabledForPlan(
        (proyecto.plan ?? "basico") as ProjectPlan,
        proyecto.cotizador_config != null
      ),
    };
    const snapshot = {
      proyecto: snapshotProyecto,
      tipologias: tipologias || [],
```

(Leave the remaining snapshot keys unchanged — only the leading `proyecto,` line is replaced by `proyecto: snapshotProyecto,`.)

- [ ] **Step 4: Run unit test (PASS) + manual publish verification**

```bash
npm test src/lib/__tests__/snapshot-cotizador.test.ts
```

Expected output (PASS): all 3 assertions green.

Manual verification on dev/preview (the real route): pick a `basico` project that currently has a `cotizador_config`, publish it, then confirm via SQL that the published snapshot's flag is `false`:

```sql
SELECT (snapshot -> 'proyecto' ->> 'cotizador_enabled') AS snap_cotizador,
       p.plan
FROM proyecto_versiones v
JOIN proyectos p ON p.id = v.proyecto_id
WHERE p.plan = 'basico'
ORDER BY v.version_number DESC
LIMIT 1;
```

Expected: `snap_cotizador = false` for a `basico` project (regardless of its live `cotizador_enabled`), and the public `/sites/[slug]` cotizador button is absent.

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: 0 errors; full suite green.

```bash
git add src/app/api/proyectos/[id]/publicar/route.ts src/lib/__tests__/snapshot-cotizador.test.ts
git commit -m "fix: derive cotizador visibility from plan in publish snapshot"
```

---

### Task 6: Reconcile `PRICING.md` + marketing copy with the canonical model (docs/config cleanup)

> DECISION GATE: see top-of-file gate — this task is the one that makes `PRICING.md` truthful. Under **Option A** we rewrite `PRICING.md` to the live $199/$249 `basico`/`pro` model. Under **Option B** we instead update `plan-config.ts`/i18n to the $79/$149 `esencial`/`profesional` model and leave `PRICING.md` as-is. The steps below are written for **Option A**.

`PRICING.md` currently advertises **$79/$149, "Esencial"/"Profesional"** while the entire codebase (config, GHL, marketing i18n, admin route, DB constraint) uses **$199/$249, `basico`/`pro`**. Whichever model is canonical, exactly one of these must change so support, sales, and the app agree.

**Files:**
- Modify: `PRICING.md:1-69` (full rewrite to canonical tiers/prices)
- Verify (read-only): `src/i18n/locales/es/marketing.ts:289-315`, `src/i18n/locales/en/marketing.ts:289-306` (already $199/$249 — confirm no change needed)

- [ ] **Step 1: Confirm marketing i18n already matches canonical (no code change)**

```bash
grep -nE "basicoPrice|proPrice|basicoName|proName|personalizadoName|personalizadoPrice" src/i18n/locales/es/marketing.ts src/i18n/locales/en/marketing.ts
```

Expected output: ES + EN both show `basicoPrice: "199"`, `proPrice: "249"`, names `Básico`/`Basic`, `Pro`, `Personalizado`. These already match Option A — **no i18n edit required**. (If Option B is chosen instead, this is where the slug/price/i18n-key edits go.)

- [ ] **Step 2: Rewrite `PRICING.md` to the canonical $199/$249 `basico`/`pro` model**

Replace the entire contents of `PRICING.md` with the canonical table (Básico $199 / Pro $249, gated features = cotizador + correos_branded + estadísticas avanzadas, storage 10/50 GB, collaborators 3/10, projects 1/5, units 200/500, Enterprise custom). Keep the existing "Differentiation" framing (the key difference is the cotizador / sales engine) but correct the slugs, prices, and limits so they equal `plan-config.ts`. Example skeleton (fill all rows to match `PLAN_TIERS`):

```md
# NODDO — Pricing Structure

> Single source of truth for tiers, prices, storage, and limits is
> `src/lib/plan-config.ts` (`PLAN_TIERS`). Keep this doc in sync with it.

## Plans

### Básico — $199 USD/mes por proyecto
| Feature | Included |
|---|---|
| Proyectos activos | 1 |
| Unidades por proyecto | Hasta 200 |
| Colaboradores | Hasta 3 |
| Almacenamiento | 10 GB |
| Cotizador (NodDo Quote) | ✗ |
| Correos personalizados (branded) | ✗ |
| Estadísticas avanzadas | ✗ |

### Pro — $249 USD/mes por proyecto
| Feature | Included |
|---|---|
| Proyectos activos | 5 |
| Unidades por proyecto | Hasta 500 |
| Colaboradores | Hasta 10 |
| Almacenamiento | 50 GB |
| Cotizador (NodDo Quote) | ✓ |
| Correos personalizados (branded) | ✓ |
| Estadísticas avanzadas | ✓ |

### Enterprise — Personalizado (contactar ventas)
Portafolio extenso; herramientas a medida, onboarding dedicado, soporte premium.
Precio personalizado.

## Differentiation
- **Básico** = micrositio premium completo (galería, videos, mapas, tours, contacto, disponibilidad).
- **Pro** = Básico + motor de ventas: cotizador (PDF), correos branded, estadísticas avanzadas, más colaboradores y almacenamiento.
- **Enterprise** = Pro + herramientas a medida y soporte 24/7.
```

- [ ] **Step 3: Verify gate (docs-only — typecheck/lint still must pass for the touched config) + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: 0 errors (nothing structural changed; this confirms no accidental code edits crept in).

```bash
git add PRICING.md
git commit -m "docs: align PRICING.md with canonical basico/pro plan-config model"
```

---

### Task 7: Push `fix/plan-billing` to `dev` and open preview (NO main)

**Files:** none (git only).

- [ ] **Step 1: Final full verify gate**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck 0 errors, lint 0 errors, vitest `Test Files  3 passed` (plan-config, plan-sync, snapshot-cotizador).

- [ ] **Step 2: Push the fix branch (preview only)**

```bash
git push origin fix/plan-billing
```

Then open a PR `fix/plan-billing → dev` (NOT main). Per WORKFLOW.md, production (`main` / noddo.io) is owner-approval-only; do not merge to main.

- [ ] **Step 3: Smoke on the Vercel preview**

Confirm on the preview URL: (a) a `basico` project shows the editor cotizador/estadísticas tabs locked (PlanGateBadge), (b) its public microsite shows NO cotizador button, (c) a `pro` project with a config still shows and runs the cotizador, (d) flipping a project `pro → basico` in platform-admin immediately hides the public cotizador after re-publish. Report results to the owner before any main merge.

---

## Task dependency / order

- **Task 1 (vitest)** — no deps. Do first; everything else is TDD on it.
- **Task 2 (single source of truth)** — depends on Task 1; **blocked by the top-of-file DECISION GATE** (taxonomy/prices). Establishes the tables Tasks 3/4/6 reference.
- **Task 3 (corrective migration)** — depends on the decision gate (slugs); logically pairs with Task 2 but only needs the DB, so it can run in parallel with Task 2's code edits. Contains its own sub-gate (3-KEEP vs 3-RESET).
- **Task 4 (admin route sync)** — depends on Task 2 (adds `isCotizadorEnabledForPlan` to `plan-config.ts`). Task 5 reuses that helper, so do Task 4 before Task 5.
- **Task 5 (snapshot derivation)** — depends on Task 4 (shared helper).
- **Task 6 (PRICING.md / i18n reconcile)** — depends on the decision gate; independent of Tasks 3/4/5 code-wise, do last among content tasks.
- **Task 7 (push to dev)** — depends on all of 1–6.

## Per-task effort estimate

| Task | Effort |
|---|---|
| 1 — vitest setup | 0.5d |
| 2 — single source of truth | 0.5d |
| 3 — corrective migration + heal | 0.5d |
| 4 — admin route plan/cotizador sync | 0.5d |
| 5 — publish snapshot derivation | 0.5d |
| 6 — PRICING.md / i18n reconcile | 0.5d |
| 7 — push + preview smoke | 0.5d |
| **Total** | **~3–3.5d** (plus owner decision-gate turnaround on taxonomy) |
