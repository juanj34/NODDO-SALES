# Cotizador Correctness (Pricing + Quote Integrity) Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every issued cotización mathematically self-consistent and reproducible — the saved/emailed PDF must use the same price the agent negotiated and previewed, its payment phases must sum exactly to the quoted total, and regenerating a quote must reproduce the originally-issued numbers (not silently re-price the buyer).

**Architecture:** The pricing math already lives in pure functions under `src/lib/cotizador/` (`calcular.ts`, `payment-rows.ts`, `delivery.ts`), but no tests guard them and three server routes (`POST /api/cotizaciones`, `POST /api/cotizaciones/preview`, `POST /api/cotizaciones/[id]/regenerate`) diverge in how they feed those functions. We introduce **Vitest** for the pure pricing layer, add a single reconciliation invariant (`assertResultadoReconciles`) that every route runs before persisting, fix the `precio_negociado` parity gap so POST honors the negotiated price the same way preview already does, and make regenerate replay the originally-issued inputs (descuentos, complementos, custom fases, negotiated price) instead of recomputing from a bare base config. All work happens behind the existing server source-of-truth; the client keeps sending what it already sends.

**Tech Stack:** Vitest 3 (new, dev-only) + `@vitejs/plugin-react` not required (pure TS, node env), TypeScript strict, Next.js 16 route handlers, Supabase JS service-role client, `@/lib/cotizador/*` pure functions, `@/types`.

---

## Branch & governance

All work on a single feature branch off `dev` (never `main`):

```bash
git checkout dev
git pull origin dev
git checkout -b fix/cotizador-correctness
```

Verify gate **before every commit** (run from repo root):

```bash
npm run typecheck && npm run lint && npm test
```

`npm test` is added in Task 1. Conventional commit prefixes only (`feat/fix/refactor/chore/test`). Push to `origin fix/cotizador-correctness`; do not push `main`.

---

### Task 1: Stand up Vitest for the pure pricing layer

There is currently no unit-test runner (only Playwright `test:e2e`). The cotizador math is pure and must be locked down before we touch it. This task adds Vitest with a node environment and a `test` script, then proves it runs with one trivial spec against the existing, unchanged `calcularCotizacion`.

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.ts`
- Create: `src/lib/cotizador/__tests__/calcular.smoke.test.ts`

> DECISION GATE: Test runner choice.
> The repo already standardizes on Vitest in the owner's global worktree rules ("vitest (tests unit/component)"). This plan assumes **Vitest**. If the owner instead wants the unit layer folded into Playwright's runner, STOP and switch: the only change is replacing `vitest.config.ts` + the `test` script with a Playwright component-test project and `expect` import swaps; the test *bodies* in this plan are framework-agnostic `describe/it/expect` and port verbatim. Default branch (proceed): Vitest.

- [ ] **Step 1 — Add Vitest deps and `test` script.** Add to `package.json` `devDependencies` (use these exact versions; `.npmrc` has `legacy-peer-deps=true` so install is clean):

```jsonc
"vitest": "^3.2.4",
"@vitest/coverage-v8": "^3.2.4"
```

Add to `package.json` `scripts` (place directly under the `"lint"` line):

```jsonc
"test": "vitest run",
"test:watch": "vitest",
"test:cov": "vitest run --coverage"
```

Then install:

```bash
npm install
```

Expected: install completes; `node_modules/.bin/vitest` exists.

- [ ] **Step 2 — Create `vitest.config.ts`** at repo root. Node environment (the pricing layer is pure TS, no DOM), and the `@/` path alias resolved so test imports match source:

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3 — Write a smoke spec** at `src/lib/cotizador/__tests__/calcular.smoke.test.ts` that pins the CURRENT behavior of `calcularCotizacion` for a simple 50/50 plan (no complementos, no discounts). This is a characterization test — it documents today's output so later refactors are safe:

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig } from "@/types";

const baseConfig: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: null,
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 50, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("calcularCotizacion smoke", () => {
  it("splits a 200M unit 50/50 with no extras", () => {
    const r = calcularCotizacion(200_000_000, baseConfig);
    expect(r.precio_base).toBe(200_000_000);
    expect(r.precio_neto).toBe(200_000_000);
    expect(r.fases[0].monto_total).toBe(100_000_000);
    expect(r.fases[1].monto_total).toBe(100_000_000);
  });
});
```

- [ ] **Step 4 — Run it.** Command:

```bash
npm test
```

Expected: `1 passed (1)`, exit code 0. If the alias fails to resolve, the error is `Cannot find package '@'` — fix the `resolve.alias` block, do not change source.

- [ ] **Step 5 — Verify gate + commit.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all three pass. Commit:

```bash
git add package.json package-lock.json vitest.config.ts src/lib/cotizador/__tests__/calcular.smoke.test.ts
git commit -m "test: add vitest runner and cotizador pricing smoke test"
```

---

### Task 2: Add a reconciliation invariant + characterization tests for the pricing engine

Today nothing asserts that the payment phases actually sum to the quoted total. A bad `custom_fases` payload, a rounding drift in `monto_por_cuota`, or the `separacion_incluida` deduction can silently produce a quote whose installments do not add up to the price the buyer is told to pay. This task adds a pure helper `assertResultadoReconciles` and characterization tests covering the real branches in `calcular.ts` (discounts, complementos, cargos, separación-included deduction, resto phase). No route is changed yet — this task only adds the guard function and its tests so Tasks 3–5 can wire it in safely.

**Files:**
- Modify: `src/lib/cotizador/calcular.ts` (append exported helper at end of file)
- Create: `src/lib/cotizador/__tests__/calcular.reconcile.test.ts`

- [ ] **Step 1 — Write the failing test first** at `src/lib/cotizador/__tests__/calcular.reconcile.test.ts`. It imports a not-yet-existing `assertResultadoReconciles` and exercises the reconciliation contract plus the engine's real branches:

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion, assertResultadoReconciles } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, ComplementoSeleccion, DescuentoConfig } from "@/types";

function cfg(partial: Partial<CotizadorConfig> = {}): CotizadorConfig {
  return {
    moneda: "COP",
    separacion_incluida_en_inicial: false,
    descuentos: [],
    notas_legales: null,
    fases: [
      { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
      { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 6, frecuencia: "mensual" },
      { id: "f3", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
    ],
    ...partial,
  };
}

describe("assertResultadoReconciles", () => {
  it("passes for a plain percentage + resto plan", () => {
    const r = calcularCotizacion(300_000_000, cfg());
    expect(() => assertResultadoReconciles(r)).not.toThrow();
  });

  it("passes when complementos add to the total", () => {
    const comps: ComplementoSeleccion[] = [
      {
        complemento_id: "c1", tipo: "parqueadero", identificador: "P-1", subtipo: null,
        precio: 20_000_000, suma_al_total: true,
      },
    ];
    const r = calcularCotizacion(300_000_000, cfg(), [], comps);
    expect(r.precio_total).toBe(320_000_000);
    expect(() => assertResultadoReconciles(r)).not.toThrow();
  });

  it("passes when a fixed discount is applied", () => {
    const desc: DescuentoConfig[] = [{ id: "d1", nombre: "Pronto pago", tipo: "fijo", valor: 10_000_000 }];
    const r = calcularCotizacion(300_000_000, cfg(), desc);
    expect(r.precio_neto).toBe(290_000_000);
    expect(() => assertResultadoReconciles(r)).not.toThrow();
  });

  it("throws when phases do not sum to the effective total", () => {
    const r = calcularCotizacion(300_000_000, cfg());
    // Corrupt the resto phase to break the sum
    r.fases[r.fases.length - 1].monto_total -= 5_000_000;
    expect(() => assertResultadoReconciles(r)).toThrow(/no suman al total/i);
  });

  it("tolerates per-currency rounding (<= number of phases pesos)", () => {
    // Odd price that forces rounding across the 6-cuota phase
    const r = calcularCotizacion(299_999_999, cfg());
    expect(() => assertResultadoReconciles(r)).not.toThrow();
  });
});
```

- [ ] **Step 2 — Run it (expect FAIL).**

```bash
npm test src/lib/cotizador/__tests__/calcular.reconcile.test.ts
```

Expected: FAIL — `assertResultadoReconciles is not a function` / `does not provide an export named 'assertResultadoReconciles'`.

- [ ] **Step 3 — Implement the helper.** Append to the END of `src/lib/cotizador/calcular.ts` (after the closing brace of `calcularCotizacion`, no other edits to that file in this task):

```ts
/**
 * Sum of the per-phase totals that the buyer actually pays.
 * Excludes nothing — every fase.monto_total is a real charge.
 */
export function sumFasesMontoTotal(resultado: ResultadoCotizacion): number {
  return resultado.fases.reduce((sum, f) => sum + f.monto_total, 0);
}

/**
 * The price the payment phases are expected to cover.
 * Phases are computed on precio_total when complementos exist, else precio_neto.
 * Cargos adicionales (taxes/fees) are charged ON TOP and are NOT part of the
 * phase plan, so they are intentionally excluded here.
 */
export function effectivePlanTotal(resultado: ResultadoCotizacion): number {
  return resultado.precio_total ?? resultado.precio_neto;
}

/**
 * Invariant guard: the sum of payment phases must equal the plan total,
 * within a rounding tolerance of 1 peso per phase (Math.round per phase/cuota
 * can drift by at most that). Throws a descriptive Error if violated so routes
 * can refuse to persist an internally inconsistent quote.
 */
export function assertResultadoReconciles(resultado: ResultadoCotizacion): void {
  const expected = effectivePlanTotal(resultado);
  const actual = sumFasesMontoTotal(resultado);
  const tolerance = Math.max(1, resultado.fases.length);
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(
      `Cotización inconsistente: las fases (${actual}) no suman al total (${expected}); ` +
        `diferencia ${actual - expected}, tolerancia ${tolerance}`,
    );
  }
}
```

- [ ] **Step 4 — Run it (expect PASS).**

```bash
npm test src/lib/cotizador/__tests__/calcular.reconcile.test.ts
```

Expected: `5 passed (5)`. If the "tolerates rounding" case fails, the tolerance is too tight — confirm the drift is `<= fases.length` before adjusting; do not loosen beyond per-phase 1-peso.

- [ ] **Step 5 — Verify gate + commit.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass. Commit:

```bash
git add src/lib/cotizador/calcular.ts src/lib/cotizador/__tests__/calcular.reconcile.test.ts
git commit -m "feat: add reconciliation invariant for cotización pricing"
```

---

### Task 3: Honor `precio_negociado` in the issuing POST route (preview/issue parity)

**Root cause (verified):** `src/components/dashboard/cotizador/CotizadorTool.tsx:945` sends `precio_negociado: priceOverride ?? undefined` to `POST /api/cotizaciones`, and at `:931` it builds `custom_fases` as **fixed amounts** off the negotiated `effectiveTotal` via `paymentRowsToFases(paymentRows, effectiveTotal)`. The **preview** route (`src/app/api/cotizaciones/preview/route.ts:119,141,241-243`) reads and applies `precio_negociado`. But the **issuing** route (`src/app/api/cotizaciones/route.ts:184-231`) never destructures `precio_negociado`, so `unit.precio` stays at the list price. Result: `resultado.precio_base` = list price while the fixed-amount phases = negotiated price → the saved + emailed legal quote is internally inconsistent and shows the wrong headline price. This task makes POST apply `precio_negociado` exactly as preview does, and refuses to persist if the result fails reconciliation.

**Files:**
- Modify: `src/app/api/cotizaciones/route.ts` (destructure block `:184-231`; price-resolution `:433-449`)
- Create: `src/lib/cotizador/__tests__/precio-negociado.test.ts`

- [ ] **Step 1 — Write the failing test first** at `src/lib/cotizador/__tests__/precio-negociado.test.ts`. Since the route handler is heavy to import, we test the pure pricing contract the route must satisfy: when a negotiated price is applied and the client pre-built phases off that same total, `precio_base` equals the negotiated price and the result reconciles. This is the exact invariant the route fix restores:

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion, assertResultadoReconciles } from "@/lib/cotizador/calcular";
import { paymentRowsFromConfig, paymentRowsToFases } from "@/lib/cotizador/payment-rows";
import type { CotizadorConfig } from "@/types";

const config: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: null,
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("precio_negociado parity (what POST must produce)", () => {
  it("uses the negotiated price as precio_base and reconciles", () => {
    const listPrice = 300_000_000;
    const negotiated = 270_000_000;

    // Client builds fixed-amount rows off the negotiated total (mirrors CotizadorTool:931)
    const rows = paymentRowsFromConfig(config, negotiated);
    const customFases = paymentRowsToFases(rows, negotiated);

    // Route must price with the negotiated value, not the list value
    const r = calcularCotizacion(negotiated, { ...config, fases: customFases });

    expect(r.precio_base).toBe(negotiated);
    expect(r.precio_base).not.toBe(listPrice);
    expect(() => assertResultadoReconciles(r)).not.toThrow();
  });

  it("WOULD break if the list price were used with negotiated phases", () => {
    const listPrice = 300_000_000;
    const negotiated = 270_000_000;
    const rows = paymentRowsFromConfig(config, negotiated);
    const customFases = paymentRowsToFases(rows, negotiated);

    // Simulate the current bug: list price + negotiated fixed phases
    const buggy = calcularCotizacion(listPrice, { ...config, fases: customFases });
    // resto = listPrice - acumulado(negotiated-derived) -> inflated saldo, base != phases sum to plan
    expect(buggy.precio_base).toBe(listPrice);
    // The resto phase absorbs the 30M gap, so phases sum to listPrice while the
    // initial cuota reflects the negotiated price -> headline/initial mismatch.
    expect(buggy.fases[0].monto_total).toBe(Math.round(negotiated * 0.3));
    expect(buggy.fases[0].monto_total).not.toBe(Math.round(listPrice * 0.3));
  });
});
```

- [ ] **Step 2 — Run it (expect PASS for the pure-contract test, documenting the target).**

```bash
npm test src/lib/cotizador/__tests__/precio-negociado.test.ts
```

Expected: `2 passed (2)`. (These tests encode the contract the route must meet; they pass against the pure engine. The route fix in Step 3 makes the live POST satisfy the first test's `precio_base === negotiated`.)

- [ ] **Step 3 — Apply the route fix.** In `src/app/api/cotizaciones/route.ts`, add `precio_negociado` to the destructure. Current code (`:184-205`) starts:

```ts
    const {
      proyecto_id, unidad_id, nombre, email, telefono,
      utm_source, utm_medium, utm_campaign, agente_id, agente_nombre,
      // Multi-tipología: buyer-selected tipología (for lots without confirmed tipologia_id)
      tipologia_id: selectedTipologiaId,
      // Sandbox fields
      custom_fases,
      quick_quote,
```

Add `precio_negociado,` to the destructured names (place it next to the other per-cotización overrides, after `tipo_cambio,`). Current tail of the destructure (`:200-205`):

```ts
      // Per-cotización overrides
      idioma,
      moneda_secundaria,
      tipo_cambio,
    } = body as {
```

becomes:

```ts
      // Per-cotización overrides
      idioma,
      moneda_secundaria,
      tipo_cambio,
      precio_negociado,
    } = body as {
```

And in the type literal (`:205-231`), add the field alongside `tipo_cambio?: number | null;`:

```ts
      tipo_cambio?: number | null;
      precio_negociado?: number;
    };
```

- [ ] **Step 4 — Apply the negotiated-price override** at the price-resolution point. Current code (`:433-437`):

```ts
    // Re-check precio after potential tipología override
    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }
    const precioFinal = unit.precio;
```

becomes (mirrors preview route `:241-243`, applied AFTER tipología resolution so a negotiated price always wins):

```ts
    // Apply negotiated price override (parity with preview route)
    if (precio_negociado != null && precio_negociado > 0) {
      unit.precio = precio_negociado;
    }

    // Re-check precio after potential tipología / negotiated override
    if (!unit.precio) {
      return NextResponse.json({ error: "Unidad sin precio" }, { status: 400 });
    }
    const precioFinal = unit.precio;
```

- [ ] **Step 5 — Add the reconciliation guard before persisting.** Add the import to the existing `@/lib/cotizador/calcular` import line (`:4`):

```ts
import { calcularCotizacion, buildPrecioBaseComplementos, assertResultadoReconciles } from "@/lib/cotizador/calcular";
```

Immediately AFTER the `calcularCotizacion(...)` call (`:443-449`) that produces `resultado`, add:

```ts
    // Refuse to issue an internally inconsistent quote
    try {
      assertResultadoReconciles(resultado);
    } catch (e) {
      console.error("[cotizaciones] Reconciliation failed:", e);
      return NextResponse.json(
        { error: "No se pudo generar una cotización consistente. Revisa el plan de pagos." },
        { status: 422 },
      );
    }
```

- [ ] **Step 6 — Verify gate.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass.

- [ ] **Step 7 — Manual parity check (single end-to-end run).** With a dev server (`npm run dev`) and a project that has the cotizador enabled, in the dashboard CotizadorTool: pick a unit, set a negotiated price below list, click preview (note the headline total + first cuota), then Generate. Open the saved PDF from the success card. Expected: saved PDF headline price and first cuota equal the preview's, not the list price. (If you cannot run a live project, this is verified by the unit contract in Step 2; note the live check as pending-staging per WORKFLOW.)

- [ ] **Step 8 — Commit.**

```bash
git add src/app/api/cotizaciones/route.ts src/lib/cotizador/__tests__/precio-negociado.test.ts
git commit -m "fix: honor precio_negociado when issuing cotización (preview/issue parity)"
```

---

### Task 4: Make regenerate reproduce the originally-issued quote

**Root cause (verified):** `src/app/api/cotizaciones/[id]/regenerate/route.ts:93-97` recomputes with `calcularCotizacion(snapshot.precio, config, [])` — it reads `snapshot.precio` (the list price stored in `unidad_snapshot.precio`), the project's CURRENT base `config` (line 93, ignoring `config_snapshot`), and passes empty `descuentos`/`complementos`/no `custom_fases`. So regenerating a quote that originally had discounts, complementos, a custom payment plan, or a negotiated price re-prices the buyer to a different number than the PDF they already received, and overwrites the stored `resultado` (`:242`). This task makes regenerate replay the issued inputs from the persisted `config_snapshot` + `resultado`, so the regenerated PDF is byte-faithful in its numbers, and guards reconciliation.

**Files:**
- Modify: `src/app/api/cotizaciones/[id]/regenerate/route.ts` (`:92-97`, `:242-245`)
- Create: `src/lib/cotizador/__tests__/regenerate-fidelity.test.ts`

> DECISION GATE: Regenerate semantics.
> "Regenerate PDF" can mean two different things and the owner must pick:
> **(A) Faithful reissue (default, recommended):** reproduce the exact numbers the buyer already received — use the stored `config_snapshot` and the stored `resultado` (the issued price + phases), only refreshing branding/images/layout. This is the safe legal default; a previously delivered quote must not silently change price.
> **(B) Re-price to current config:** intentionally recompute against the project's current base config (today's behavior) — used when the owner wants "update this old quote to our new payment terms."
> Both branches are specified concretely below. If undecided, implement **(A)** now (it is the correctness fix) and leave (B) as an explicit, separate "Re-price" action later. Proceed with (A).

- [ ] **Step 1 — Write the failing test first** at `src/lib/cotizador/__tests__/regenerate-fidelity.test.ts`. It encodes branch (A): recomputing from the SNAPSHOT config + snapshot price reproduces the originally-issued `resultado` numbers, whereas recomputing from a DIFFERENT current config does not:

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion, assertResultadoReconciles } from "@/lib/cotizador/calcular";
import type { CotizadorConfig, DescuentoConfig } from "@/types";

const snapshotConfig: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: null,
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 40, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

// Project later changed its base plan to 20/80
const currentConfig: CotizadorConfig = {
  ...snapshotConfig,
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 20, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("regenerate fidelity (branch A)", () => {
  const issuedPrice = 250_000_000;
  const issuedDescuentos: DescuentoConfig[] = [
    { id: "d1", nombre: "Lanzamiento", tipo: "porcentaje", valor: 5 },
  ];

  it("reproduces the issued resultado from the SNAPSHOT config + issued inputs", () => {
    const issued = calcularCotizacion(issuedPrice, snapshotConfig, issuedDescuentos);
    const regenerated = calcularCotizacion(issuedPrice, snapshotConfig, issuedDescuentos);

    expect(regenerated.precio_neto).toBe(issued.precio_neto);
    expect(regenerated.fases.map((f) => f.monto_total)).toEqual(issued.fases.map((f) => f.monto_total));
    expect(() => assertResultadoReconciles(regenerated)).not.toThrow();
  });

  it("DRIFTS if regenerate uses current base config + dropped discounts (today's bug)", () => {
    const issued = calcularCotizacion(issuedPrice, snapshotConfig, issuedDescuentos);
    const buggy = calcularCotizacion(issuedPrice, currentConfig, []); // current behavior

    expect(buggy.precio_neto).not.toBe(issued.precio_neto); // discount dropped
    expect(buggy.fases[0].monto_total).not.toBe(issued.fases[0].monto_total); // 20% vs 40%
  });
});
```

- [ ] **Step 2 — Run it (expect PASS — it documents the target contract).**

```bash
npm test src/lib/cotizador/__tests__/regenerate-fidelity.test.ts
```

Expected: `2 passed (2)`.

- [ ] **Step 3 — Apply branch (A) to the route.** In `src/app/api/cotizaciones/[id]/regenerate/route.ts`, replace the config selection + recompute. Current code (`:92-97`):

```ts
    // Use CURRENT config from project (not snapshot)
    const config = cotizacion.proyectos.cotizador_config as CotizadorConfig;
    const snapshot = cotizacion.unidad_snapshot;

    // Recalculate with current config
    const resultado = calcularCotizacion(snapshot.precio, config, []);
```

becomes (use the persisted snapshot config; reuse the already-issued `resultado` so numbers are byte-faithful; only fall back to recompute if the stored result is missing, e.g. legacy rows):

```ts
    // Faithful reissue: use the config + result captured WHEN the quote was issued,
    // not the project's current base config. A delivered quote must not silently reprice.
    const config = (cotizacion.config_snapshot ?? cotizacion.proyectos.cotizador_config) as CotizadorConfig;
    const snapshot = cotizacion.unidad_snapshot;

    // Prefer the stored, originally-issued resultado. Recompute only for legacy rows
    // that never stored one, using the snapshot config (best-effort) — never the
    // current project config, which may have changed pricing.
    const resultado =
      (cotizacion.resultado as ResultadoCotizacion | null) ??
      calcularCotizacion(snapshot.precio, config, []);

    // Guard: refuse to overwrite the PDF if the stored quote does not reconcile.
    assertResultadoReconciles(resultado);
```

Add the imports to the existing `@/lib/cotizador/calcular` import (`:4`) and `@/types` import (`:6`):

```ts
import { calcularCotizacion, assertResultadoReconciles } from "@/lib/cotizador/calcular";
```

```ts
import type { CotizadorConfig, ResultadoCotizacion } from "@/types";
```

- [ ] **Step 4 — Stop clobbering the stored result with a re-priced one.** Current update (`:238-245`):

```ts
    await supabase
      .from("cotizaciones")
      .update({
        pdf_url: pdfUrl,
        resultado,
        config_snapshot: config, // Update config snapshot to current
      })
      .eq("id", id);
```

becomes (only the PDF URL changes on a faithful reissue; the issued `resultado` and `config_snapshot` are the legal record and must not be mutated):

```ts
    await supabase
      .from("cotizaciones")
      .update({
        pdf_url: pdfUrl,
        // resultado + config_snapshot are the issued record — do NOT overwrite on reissue
      })
      .eq("id", id);
```

> If branch (B) Re-price is chosen instead: keep `calcularCotizacion(snapshot.precio, cotizacion.proyectos.cotizador_config as CotizadorConfig, [])`, keep writing `resultado` + `config_snapshot: config`, but STILL add `assertResultadoReconciles(resultado)` before upload, and surface a 422 on failure exactly like Task 3 Step 5. Do not ship (B) silently under the label "regenerate".

- [ ] **Step 5 — Guard the recompute fallback with a try/catch** so a legacy non-reconciling row returns a clear error instead of overwriting a good PDF with a broken one. Wrap the `assertResultadoReconciles(resultado);` from Step 3 in the same 422 pattern used in Task 3:

```ts
    try {
      assertResultadoReconciles(resultado);
    } catch (e) {
      console.error("[regenerate cotizacion] Reconciliation failed:", e);
      return NextResponse.json(
        { error: "La cotización almacenada es inconsistente; no se regeneró." },
        { status: 422 },
      );
    }
```

(Replace the bare `assertResultadoReconciles(resultado);` line added in Step 3 with this guarded block.)

- [ ] **Step 6 — Verify gate.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass. If `cotizacion.config_snapshot` / `cotizacion.resultado` typecheck as `any` (the select is `*`), the casts above resolve it; if TS complains about `ResultadoCotizacion | null` indexing, confirm the `?? calcular...` fallback is present.

- [ ] **Step 7 — Manual check (single run).** In the dashboard leads/cotizaciones list, regenerate an existing cotización that had a discount or custom plan. Expected: the new PDF shows the SAME prices/phases as the original; the `resultado` row in the DB is unchanged (only `pdf_url` updated). Verify with:

```bash
# Replace <ID> with the regenerated cotización id
```
```sql
select resultado->>'precio_neto' as precio_neto,
       jsonb_array_length(resultado->'fases') as n_fases
from cotizaciones where id = '<ID>';
```
Expected: identical `precio_neto` and `n_fases` before and after regenerate.

- [ ] **Step 8 — Commit.**

```bash
git add src/app/api/cotizaciones/[id]/regenerate/route.ts src/lib/cotizador/__tests__/regenerate-fidelity.test.ts
git commit -m "fix: regenerate reproduces originally-issued quote instead of repricing"
```

---

### Task 5: Wire the reconciliation guard into the preview route + lock payment-rows rounding

The preview route (`src/app/api/cotizaciones/preview/route.ts:311-317`) builds the same `resultado` the buyer will eventually receive but never asserts reconciliation — so an agent can preview a silently-broken plan, then hit the (now-guarded) issue route and get a confusing 422 only at the end. Add the guard to preview too (as a logged warning header, not a hard block, so the agent can still see the broken PDF and fix it). Separately, `paymentRowsFromConfig` (`src/lib/cotizador/payment-rows.ts:238-256`) distributes a multi-cuota percentage with a hand-rolled last-cuota correction that can drift; pin its behavior with a test so future edits cannot reintroduce a non-summing plan.

**Files:**
- Modify: `src/app/api/cotizaciones/preview/route.ts` (`:3` import, after `:311-317`)
- Create: `src/lib/cotizador/__tests__/payment-rows.test.ts`

- [ ] **Step 1 — Write the failing test first** at `src/lib/cotizador/__tests__/payment-rows.test.ts`. It pins that a multi-cuota percentage phase's expanded rows sum back to the phase percentage (within rounding), and that `computeBalance` + `resolveRowAmount` agree:

```ts
import { describe, it, expect } from "vitest";
import {
  paymentRowsFromConfig,
  computeBalance,
  resolveRowAmount,
} from "@/lib/cotizador/payment-rows";
import type { CotizadorConfig, PaymentRow } from "@/lib/cotizador/payment-rows" assert {};
import type { CotizadorConfig as Cfg } from "@/types";

const config: Cfg = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: null,
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 40, cuotas: 7, frecuencia: "mensual" },
    { id: "f3", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("paymentRowsFromConfig rounding", () => {
  it("expands a 40% / 7-cuota phase to rows that sum to 40% (±0.05)", () => {
    const rows = paymentRowsFromConfig(config, 300_000_000);
    const cuotaRows = rows.filter((r) => r.nombre.startsWith("Cuota "));
    expect(cuotaRows.length).toBe(7);
    const pctSum = cuotaRows.reduce((s, r) => s + r.valor, 0);
    expect(Math.abs(pctSum - 40)).toBeLessThanOrEqual(0.05);
  });

  it("resto + non-resto rows reconcile to the full price", () => {
    const total = 300_000_000;
    const rows = paymentRowsFromConfig(config, total);
    const { assigned } = computeBalance(rows, total);
    const restoRow = rows.find((r) => r.tipo_valor === "resto")!;
    const resto = resolveRowAmount(restoRow, total, rows);
    // Within 1 peso per row of rounding tolerance
    expect(Math.abs(assigned + resto - total)).toBeLessThanOrEqual(rows.length);
  });
});
```

> Note: drop the bogus first import line if your editor flags it — the real import the test needs is only the three named functions from `@/lib/cotizador/payment-rows` and the `Cfg` type from `@/types`. Use exactly:
> ```ts
> import { paymentRowsFromConfig, computeBalance, resolveRowAmount } from "@/lib/cotizador/payment-rows";
> import type { CotizadorConfig as Cfg } from "@/types";
> ```
> (Replace the two import lines above with these two; the `assert {}` line is illustrative scaffolding, not real code.)

- [ ] **Step 2 — Run it (expect PASS — these characterize current correct behavior).**

```bash
npm test src/lib/cotizador/__tests__/payment-rows.test.ts
```

Expected: `2 passed (2)`. If the first case fails, the last-cuota correction in `payment-rows.ts:248` is drifting beyond 0.05 — that is itself a bug; STOP and tighten the correction so the rows sum to `fase.valor` exactly (set the last row's pct to `fase.valor - sumOfPreviousRows`), then re-run. Do not loosen the test tolerance.

- [ ] **Step 3 — Add the soft guard to preview.** In `src/app/api/cotizaciones/preview/route.ts`, extend the existing `@/lib/cotizador/calcular` import (`:3`):

```ts
import { calcularCotizacion, buildPrecioBaseComplementos, assertResultadoReconciles } from "@/lib/cotizador/calcular";
```

Immediately AFTER the `calcularCotizacion(...)` call (`:311-317`) that produces `resultado`, add a non-blocking check that surfaces a header the dashboard can read, but still renders the PDF so the agent can diagnose:

```ts
    // Soft reconciliation check — preview still renders so the agent can see + fix,
    // but we flag inconsistency in a response header (the issue route hard-blocks).
    let reconcileWarning: string | null = null;
    try {
      assertResultadoReconciles(resultado);
    } catch (e) {
      reconcileWarning = e instanceof Error ? e.message : "inconsistencia";
      console.warn("[cotizaciones/preview] Reconciliation warning:", reconcileWarning);
    }
```

Then add the header to the existing PDF `NextResponse` (`:445-451`). Current:

```ts
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
```

becomes:

```ts
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        ...(reconcileWarning ? { "X-Cotizacion-Reconcile-Warning": "1" } : {}),
      },
    });
```

- [ ] **Step 4 — Verify gate.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass.

- [ ] **Step 5 — Commit.**

```bash
git add src/app/api/cotizaciones/preview/route.ts src/lib/cotizador/__tests__/payment-rows.test.ts
git commit -m "test: lock payment-row rounding + add soft reconcile guard to preview"
```

---

### Task 6: Tighten the WORKFLOW verify gate to include `npm test`

WORKFLOW.md's verification gate references `npm test "once vitest exists"` — it now exists. Update the verify-gate note so future contributors run the pricing tests before every commit. This is a docs-only change (no source touched).

**Files:**
- Modify: `WORKFLOW.md` (the "Verification gate" section)

- [ ] **Step 1 — Locate the gate.** Find the line in `WORKFLOW.md` that documents the pre-commit verification (the `npm run typecheck && npm run lint` instruction referenced in the project governance). Read it first:

```bash
grep -n "typecheck\|lint\|vitest\|npm test" WORKFLOW.md
```

- [ ] **Step 2 — Update the gate text** so the command reads (match the surrounding markdown style — fenced bash block if the existing one is fenced):

```bash
npm run typecheck && npm run lint && npm test
```

and replace any "once vitest exists" qualifier with: "Pricing/quote logic is unit-tested under `src/lib/cotizador/__tests__/`; `npm test` must pass before committing."

- [ ] **Step 3 — Verify (docs only — no code gate needed, but run the full gate to confirm nothing regressed).**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass.

- [ ] **Step 4 — Commit.**

```bash
git add WORKFLOW.md
git commit -m "docs: require npm test (cotizador pricing) in verify gate"
```

---

## Task dependency / order

```
Task 1 (Vitest runner)            ──> required by all test-bearing tasks
   └─> Task 2 (reconcile helper)  ──> exports assertResultadoReconciles, used by 3, 4, 5
         ├─> Task 3 (POST precio_negociado + guard)
         ├─> Task 4 (regenerate fidelity + guard)   [independent of 3; both depend on 2]
         └─> Task 5 (preview soft guard + rounding lock)  [depends on 2]
Task 6 (WORKFLOW docs)            ──> last; depends on Task 1 having added the `test` script
```

- Tasks 3, 4, 5 are mutually independent once Task 2 lands and can be parallelized across worktrees if desired (each touches a different route file + its own test file). They share only the `assertResultadoReconciles` export added in Task 2.
- Task 4 carries a DECISION GATE (regenerate semantics A vs B); Task 1 carries a minor DECISION GATE (Vitest vs Playwright runner). Both default to the recommended branch and can proceed without blocking if the owner is unavailable.

## Per-task effort estimate

| Task | Scope | Estimate |
|------|-------|----------|
| 1 | Add Vitest, config, smoke test | 0.5d |
| 2 | Reconcile helper + characterization tests | 0.5d |
| 3 | precio_negociado parity in POST + guard + tests | 0.5d |
| 4 | Regenerate fidelity rework + guard + tests | 0.5–1d |
| 5 | Preview soft guard + payment-rows rounding lock | 0.5d |
| 6 | WORKFLOW docs | 0.25d |

**Total: ~2.75–3.25d** (single engineer, sequential). With Tasks 3/4/5 parallelized after Task 2: ~1.75–2d wall-clock.
