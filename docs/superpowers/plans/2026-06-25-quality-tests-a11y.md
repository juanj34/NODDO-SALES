# Financial-Engine Tests + CI Wiring + Accessibility Remediation Plan

**Subsystem clusterKey:** `quality-tests-a11y`
**Branch:** `fix/quality-tests-a11y` (cut off `dev`; never push `main` without explicit owner approval — per WORKFLOW.md)
**Date:** 2026-06-25

## Goal

Stand up a Vitest unit-test suite that locks the pure financial-engine math (`src/lib/cotizador/*`, `src/lib/currency.ts`) against regression, wire it into the GitHub Actions CI gate, and remediate the four critical + five moderate WCAG 2.2 AA accessibility findings on the marketing/microsite surfaces.

## Architecture

The financial engine is already cleanly factored into **pure functions** (no DB, no React) under `src/lib/cotizador/` (`calcular.ts`, `payment-rows.ts`, `delivery.ts`, `quick-quote.ts`, `plantilla-pago.ts`) and `src/lib/currency.ts` — these are the server-side source of truth consumed by `src/app/api/cotizaciones/*/route.ts`. We add **Vitest** (Node environment, no DOM needed for the math) plus a thin **jsdom** project for the two React-component a11y tests, co-locate `*.test.ts` next to source, and add an `npm test` script that CI runs after `typecheck` and `lint`. Accessibility fixes are surgical edits to existing components (`ContactForm.tsx`, `MarketingNav.tsx`, `CustomCursor.tsx`, `ContactModal.tsx`) and `globals.css`; each is verified by a focused jsdom test or a concrete manual/axe check because most are CSS/DOM-attribute changes rather than logic.

## Tech Stack

- **Vitest 3** (`vitest`, `@vitejs/plugin-react`) — test runner; native ESM + TS, path-alias support via `vite-tsconfig-paths`.
- **@testing-library/react** + **@testing-library/jest-dom** + **jsdom** — for the 2 component a11y tests (jsdom already present transitively; we pin it as a direct devDep).
- **vitest-axe** — automated axe-core assertions inside jsdom tests.
- Existing: TypeScript strict, ESLint 9 (flat config), Next 16, React 19, Tailwind 4, Framer Motion 12, GitHub Actions.

---

> DECISION GATE (Task 0): The two new test scripts and the CI `Run tests` step assume Vitest. The owner must approve **adding 5 devDependencies** (`vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`, `@testing-library/react`, `@testing-library/jest-dom`, `vitest-axe`, `jsdom`). If the owner declines new deps, fall back branch: implement the financial-engine tests as **`node:test` + `tsx`** (zero new deps — `tsx` is already a devDep) and SKIP the two jsdom component tests (Tasks 10–11), replacing their verification with the manual axe checks already specified in those tasks. Both branches are spelled out below.

---

## Task 0 — Install + configure Vitest (DECISION GATE above)

**Files**
- Modify: `package.json:5` (scripts block), `package.json` devDependencies
- Create: `vitest.config.ts` (repo root)
- Create: `vitest.setup.ts` (repo root)
- Modify: `.github/workflows/ci.yml:34` (add test step)
- Modify: `tsconfig.json` is fine as-is (test files match `**/*.ts`); no change needed.

### Steps

- [ ] Confirm the DECISION GATE is resolved = "Vitest approved". If "declined", jump to the fallback sub-section at the end of this task.
- [ ] Install devDeps (legacy-peer-deps is already set in `.npmrc`):
  ```bash
  npm install -D vitest@^3 @vitejs/plugin-react@^4 vite-tsconfig-paths@^5 @testing-library/react@^16 @testing-library/jest-dom@^6 vitest-axe@^0.1.0 jsdom@^25
  ```
  Expected: installs without error; `package.json` devDependencies now lists the 7 packages.
- [ ] Create `vitest.config.ts` at repo root with this exact content:
  ```ts
  import { defineConfig } from "vitest/config";
  import react from "@vitejs/plugin-react";
  import tsconfigPaths from "vite-tsconfig-paths";

  export default defineConfig({
    plugins: [tsconfigPaths(), react()],
    test: {
      globals: true,
      setupFiles: ["./vitest.setup.ts"],
      // Pure-math tests run in node; component tests opt into jsdom via
      // a per-file `// @vitest-environment jsdom` pragma.
      environment: "node",
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["node_modules", ".next", "tests/e2e/**"],
    },
  });
  ```
- [ ] Create `vitest.setup.ts` at repo root with this exact content:
  ```ts
  import "@testing-library/jest-dom/vitest";
  ```
- [ ] Add test scripts to `package.json` `scripts` (insert after the `"typecheck"` line at `package.json:8`):
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  ```
- [ ] Run the empty suite to prove config loads:
  ```bash
  npm test
  ```
  Expected: Vitest starts, prints `No test files found, exiting with code 0` (or runs 0 tests). Either way exit code is non-error. This confirms config + setup resolve.
- [ ] Wire CI. In `.github/workflows/ci.yml`, after the `Run ESLint` step (currently `.github/workflows/ci.yml:33-34`) and before the `Build` step, add:
  ```yaml
      - name: Run unit tests
        run: npm test
  ```
- [ ] Verify the workflow file parses (YAML lint, optional):
  ```bash
  npx --yes yaml-lint .github/workflows/ci.yml || true
  ```
  Expected: no syntax errors reported (or command unavailable — non-blocking).
- [ ] Verify gate, then commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add package.json package-lock.json vitest.config.ts vitest.setup.ts .github/workflows/ci.yml
  git commit -m "chore: add vitest runner + wire unit tests into CI"
  ```

#### FALLBACK (DECISION GATE = declined, no new deps)
- [ ] Do NOT create `vitest.config.ts`/`vitest.setup.ts`. Add to `package.json` scripts:
  ```json
  "test": "tsx --test src/**/*.test.ts",
  ```
- [ ] In every test file below, replace `import { describe, it, expect } from "vitest";` with `import { describe, it } from "node:test"; import assert from "node:assert/strict";` and rewrite assertions: `expect(x).toBe(y)` → `assert.equal(x, y)`, `expect(x).toEqual(y)` → `assert.deepEqual(x, y)`, `expect(arr).toHaveLength(n)` → `assert.equal(arr.length, n)`.
- [ ] SKIP Tasks 10 and 11 (jsdom component tests); keep their manual axe verification steps.
- [ ] CI step becomes `run: npm test` identically. Commit message: `chore: add node:test runner + wire unit tests into CI`.

---

## Task 1 — Test: `calcularCotizacion` discounts + phase math (`calcular.ts`)

**Files**
- Test: `src/lib/cotizador/calcular.test.ts` (Create)
- Source under test: `src/lib/cotizador/calcular.ts:55` (`calcularCotizacion`)

### Steps (TDD)

- [ ] Write the failing test file `src/lib/cotizador/calcular.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { calcularCotizacion } from "./calcular";
  import type { CotizadorConfig, FaseConfig } from "@/types";

  function baseConfig(fases: FaseConfig[]): CotizadorConfig {
    return {
      moneda: "COP",
      fases,
      descuentos: [],
      separacion_incluida_en_inicial: false,
      notas_legales: null,
    };
  }

  describe("calcularCotizacion — discounts", () => {
    it("applies a percentage discount to precio_base", () => {
      const config = baseConfig([
        { id: "f1", nombre: "Total", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ]);
      const r = calcularCotizacion(100_000_000, config, [
        { id: "d1", nombre: "Pronto pago", tipo: "porcentaje", valor: 10 },
      ]);
      expect(r.precio_base).toBe(100_000_000);
      expect(r.descuentos_aplicados).toEqual([{ nombre: "Pronto pago", monto: 10_000_000 }]);
      expect(r.precio_neto).toBe(90_000_000);
    });

    it("applies a fixed discount", () => {
      const config = baseConfig([
        { id: "f1", nombre: "Total", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ]);
      const r = calcularCotizacion(100_000_000, config, [
        { id: "d1", nombre: "Bono", tipo: "fijo", valor: 5_000_000 },
      ]);
      expect(r.precio_neto).toBe(95_000_000);
    });

    it("stacks multiple discounts", () => {
      const config = baseConfig([
        { id: "f1", nombre: "Total", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ]);
      const r = calcularCotizacion(200_000_000, config, [
        { id: "d1", nombre: "Pct", tipo: "porcentaje", valor: 5 },
        { id: "d2", nombre: "Fijo", tipo: "fijo", valor: 1_000_000 },
      ]);
      expect(r.precio_neto).toBe(200_000_000 - 10_000_000 - 1_000_000);
    });
  });

  describe("calcularCotizacion — phase math", () => {
    it("splits porcentaje, fijo and resto phases summing to precio_neto", () => {
      const config = baseConfig([
        { id: "f1", nombre: "Separación", tipo: "fijo", valor: 2_000_000, cuotas: 1, frecuencia: "unica" },
        { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 20, cuotas: 4, frecuencia: "mensual" },
        { id: "f3", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ]);
      const r = calcularCotizacion(100_000_000, config);
      const [sep, cuotas, entrega] = r.fases;
      expect(sep.monto_total).toBe(2_000_000);
      expect(cuotas.monto_total).toBe(20_000_000); // 20% of 100M
      expect(cuotas.monto_por_cuota).toBe(5_000_000); // 20M / 4
      expect(entrega.monto_total).toBe(100_000_000 - 2_000_000 - 20_000_000);
      const sum = r.fases.reduce((s, f) => s + f.monto_total, 0);
      expect(sum).toBe(100_000_000);
    });

    it("computes derived porcentaje for fijo/resto phases", () => {
      const config = baseConfig([
        { id: "f1", nombre: "Separación", tipo: "fijo", valor: 10_000_000, cuotas: 1, frecuencia: "unica" },
        { id: "f2", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
      ]);
      const r = calcularCotizacion(100_000_000, config);
      expect(r.fases[0].porcentaje).toBe(10); // 10M / 100M
      expect(r.fases[1].porcentaje).toBe(90);
    });
  });
  ```
- [ ] Run it and watch it FAIL (file imports resolve but assertions must be proven against real code):
  ```bash
  npx vitest run src/lib/cotizador/calcular.test.ts
  ```
  Expected on first run BEFORE you have confirmed behavior: if any assertion is wrong vs. real code it FAILS with a diff. (No source change is needed — `calcular.ts:55` already implements this; the purpose is to lock current behavior. If all pass immediately, that is acceptable for a characterization test — note "PASS, behavior characterized".)
- [ ] Source step: NONE. `src/lib/cotizador/calcular.ts:55-208` already implements discounts (`calcular.ts:68-76`), phase split (`calcular.ts:100-148`), and derived `porcentaje` (`calcular.ts:139-143`). This is a characterization/lock test.
- [ ] Run again, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/calcular.test.ts
  ```
  Expected: `Test Files 1 passed`, all cases green.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/calcular.test.ts
  git commit -m "test: lock calcularCotizacion discount + phase math"
  ```

---

## Task 2 — Test: `calcularCotizacion` separación-incluida deduction (`calcular.ts`)

**Files**
- Test: append to `src/lib/cotizador/calcular.test.ts`
- Source under test: `src/lib/cotizador/calcular.ts:93-127` (separación deduction branch)

### Steps (TDD)

- [ ] Append this `describe` block to `src/lib/cotizador/calcular.test.ts`:
  ```ts
  describe("calcularCotizacion — separación included in cuota inicial", () => {
    it("deducts the first fijo separación from the first porcentaje phase", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [
          { id: "f1", nombre: "Separación", tipo: "fijo", valor: 5_000_000, cuotas: 1, frecuencia: "unica" },
          { id: "f2", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
          { id: "f3", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
        ],
        descuentos: [],
        separacion_incluida_en_inicial: true,
        notas_legales: null,
      };
      const r = calcularCotizacion(100_000_000, config);
      // Separación phase stays 5M
      expect(r.fases[0].monto_total).toBe(5_000_000);
      // 30% = 30M, minus the 5M separación already counted = 25M
      expect(r.fases[1].monto_total).toBe(25_000_000);
      // Entrega absorbs the rest; total still equals 100M
      const sum = r.fases.reduce((s, f) => s + f.monto_total, 0);
      expect(sum).toBe(100_000_000);
    });

    it("does NOT deduct when separacion_incluida_en_inicial is false", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [
          { id: "f1", nombre: "Separación", tipo: "fijo", valor: 5_000_000, cuotas: 1, frecuencia: "unica" },
          { id: "f2", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
          { id: "f3", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
        ],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
      };
      const r = calcularCotizacion(100_000_000, config);
      expect(r.fases[1].monto_total).toBe(30_000_000); // full 30%, no deduction
    });
  });
  ```
- [ ] Run and observe:
  ```bash
  npx vitest run src/lib/cotizador/calcular.test.ts
  ```
  Expected: PASS, proving the `shouldDeductSeparacion` logic at `calcular.ts:93-127` (deduct only when toggle on, first phase is `fijo`, and there is a later `porcentaje` phase).
- [ ] Source step: NONE (characterization of existing logic).
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/calcular.test.ts
  git commit -m "test: lock separación-incluida deduction in calcularCotizacion"
  ```

---

## Task 3 — Test: `calcularCotizacion` complementos + cargos adicionales (`calcular.ts`)

**Files**
- Test: append to `src/lib/cotizador/calcular.test.ts`
- Source under test: `src/lib/cotizador/calcular.ts:78-83` (complementos sum), `calcular.ts:150-186` (cargos / legacy split)

### Steps (TDD)

- [ ] Append this `describe` block:
  ```ts
  import type { ComplementoSeleccion } from "@/types";

  describe("calcularCotizacion — complementos add to total", () => {
    it("adds suma_al_total complementos to precio_total and bases phases on it", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [
          { id: "f1", nombre: "Inicial", tipo: "porcentaje", valor: 10, cuotas: 1, frecuencia: "unica" },
          { id: "f2", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
        ],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
      };
      const complementos: ComplementoSeleccion[] = [
        { complemento_id: "c1", tipo: "parqueadero", identificador: "P1", subtipo: null, precio: 20_000_000, suma_al_total: true },
        { complemento_id: "c2", tipo: "deposito", identificador: "D1", subtipo: null, precio: 5_000_000, suma_al_total: false },
      ];
      const r = calcularCotizacion(100_000_000, config, [], complementos);
      // only the suma_al_total=true item (20M) counts
      expect(r.complementos_total).toBe(20_000_000);
      expect(r.precio_total).toBe(120_000_000);
      // 10% phase is computed on 120M
      expect(r.fases[0].monto_total).toBe(12_000_000);
    });

    it("prefers precio_negociado over precio when present", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [{ id: "f1", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" }],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
      };
      const complementos: ComplementoSeleccion[] = [
        { complemento_id: "c1", tipo: "addon", identificador: "X", subtipo: null, precio: 10_000_000, suma_al_total: true, precio_negociado: 7_000_000 },
      ];
      const r = calcularCotizacion(100_000_000, config, [], complementos);
      expect(r.complementos_total).toBe(7_000_000);
    });
  });

  describe("calcularCotizacion — cargos adicionales + legacy split", () => {
    it("computes porcentaje + fijo cargos and exposes legacy impuestos/admin_fee", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [{ id: "f1", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" }],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
        cargos_adicionales: [
          { id: "ca1", nombre: "IVA", tipo: "porcentaje", valor: 5 },
          { id: "ca2", nombre: "Escrituración", tipo: "fijo", valor: 3_000_000 },
        ],
      };
      const r = calcularCotizacion(100_000_000, config);
      expect(r.cargos_total).toBe(5_000_000 + 3_000_000);
      expect(r.impuestos_total).toBe(5_000_000); // porcentaje split
      expect(r.admin_fee).toBe(3_000_000);       // fijo split
      expect(r.admin_fee_label).toBe("Escrituración"); // single fijo → label exposed
    });

    it("falls back to legacy impuestos + admin_fee fields when no cargos_adicionales", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [{ id: "f1", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" }],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
        impuestos: [{ id: "i1", nombre: "IVA", porcentaje: 4 }],
        admin_fee: 2_000_000,
        admin_fee_label: "Admin",
      };
      const r = calcularCotizacion(100_000_000, config);
      expect(r.impuestos_total).toBe(4_000_000);
      expect(r.admin_fee).toBe(2_000_000);
    });
  });
  ```
- [ ] Run and observe PASS:
  ```bash
  npx vitest run src/lib/cotizador/calcular.test.ts
  ```
  Expected: green. Confirms complementos filter (`calcular.ts:79-81`), `precio_negociado ?? precio` (`calcular.ts:81`), and the cargos→legacy split (`calcular.ts:151-186`).
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/calcular.test.ts
  git commit -m "test: lock complementos + cargos adicionales math in calcularCotizacion"
  ```

---

## Task 4 — Test: `buildPrecioBaseComplementos` (`calcular.ts`)

**Files**
- Test: append to `src/lib/cotizador/calcular.test.ts`
- Source under test: `src/lib/cotizador/calcular.ts:10-45`

### Steps (TDD)

- [ ] Append:
  ```ts
  import { buildPrecioBaseComplementos } from "./calcular";

  describe("buildPrecioBaseComplementos", () => {
    it("builds parqueadero + depósito virtual items with count × price", () => {
      const items = buildPrecioBaseComplementos(2, 15_000_000, 1, 4_000_000);
      expect(items).toHaveLength(2);
      const parq = items[0];
      expect(parq.tipo).toBe("parqueadero");
      expect(parq.identificador).toBe("2 parqueaderos");
      expect(parq.precio).toBe(30_000_000);
      expect(parq.cantidad).toBe(2);
      expect(parq.es_precio_base).toBe(true);
      expect(parq.suma_al_total).toBe(true);
      const depo = items[1];
      expect(depo.identificador).toBe("1 depósito"); // singular, no "s"
      expect(depo.precio).toBe(4_000_000);
    });

    it("omits items when count is 0 or price is null/0", () => {
      expect(buildPrecioBaseComplementos(0, 15_000_000, 0, 4_000_000)).toHaveLength(0);
      expect(buildPrecioBaseComplementos(2, null, 2, 0)).toHaveLength(0);
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/calcular.test.ts
  ```
  Confirms pluralization (`calcular.ts:22`, `calcular.ts:35`) and the count/price guards (`calcular.ts:18`, `calcular.ts:31`).
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/calcular.test.ts
  git commit -m "test: lock buildPrecioBaseComplementos pluralization + guards"
  ```

---

## Task 5 — Test: payment-rows resolution + balance (`payment-rows.ts`)

**Files**
- Test: `src/lib/cotizador/payment-rows.test.ts` (Create)
- Source under test: `src/lib/cotizador/payment-rows.ts:79-107` (`resolveRowAmount`), `:111-135` (`computeBalance`), `:139-145` (`deriveStructure`)

### Steps (TDD)

- [ ] Create `src/lib/cotizador/payment-rows.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { resolveRowAmount, computeBalance, deriveStructure, type PaymentRow } from "./payment-rows";

  const rows: PaymentRow[] = [
    { id: "r1", nombre: "Separación", tipo_valor: "fijo", valor: 5_000_000, fecha: "" },
    { id: "r2", nombre: "Cuota inicial", tipo_valor: "porcentaje", valor: 25, fecha: "" },
    { id: "r3", nombre: "Entrega", tipo_valor: "resto", valor: 0, fecha: "" },
  ];

  describe("resolveRowAmount", () => {
    it("returns the fixed amount for fijo rows", () => {
      expect(resolveRowAmount(rows[0], 100_000_000, rows)).toBe(5_000_000);
    });
    it("computes percentage of total for porcentaje rows", () => {
      expect(resolveRowAmount(rows[1], 100_000_000, rows)).toBe(25_000_000);
    });
    it("resto = total minus all non-resto rows", () => {
      expect(resolveRowAmount(rows[2], 100_000_000, rows)).toBe(100_000_000 - 5_000_000 - 25_000_000);
    });
    it("skips the separación fijo when separacionIncluida is true", () => {
      // resto should NOT subtract the 5M separación → 75M
      expect(resolveRowAmount(rows[2], 100_000_000, rows, true)).toBe(100_000_000 - 25_000_000);
    });
  });

  describe("computeBalance", () => {
    it("reports assigned, remaining, pctAssigned", () => {
      const b = computeBalance(rows, 100_000_000);
      expect(b.assigned).toBe(30_000_000);
      expect(b.remaining).toBe(70_000_000);
      expect(b.pctAssigned).toBe(30);
    });
    it("returns pctAssigned 0 when total is 0", () => {
      expect(computeBalance(rows, 0).pctAssigned).toBe(0);
    });
  });

  describe("deriveStructure", () => {
    it("renders the assigned/delivery split notation", () => {
      expect(deriveStructure(rows, 100_000_000)).toBe("30/70");
    });
    it("returns dash for non-positive total", () => {
      expect(deriveStructure(rows, 0)).toBe("—");
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/payment-rows.test.ts
  ```
  Confirms the separación skip-once logic (`payment-rows.ts:92-105`) and balance/structure derivation.
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/payment-rows.test.ts
  git commit -m "test: lock payment-row amount resolution + balance"
  ```

---

## Task 6 — Test: payment-rows date helpers + config expansion (`payment-rows.ts`)

**Files**
- Test: append to `src/lib/cotizador/payment-rows.test.ts`
- Source under test: `payment-rows.ts:28-75` (date parsing), `:203-281` (`paymentRowsFromConfig`)

### Steps (TDD)

- [ ] Append:
  ```ts
  import {
    parseDateStr, formatDateDisplay, addMonthsToDate, frecuenciaToMonths,
    paymentRowsFromConfig,
  } from "./payment-rows";
  import type { CotizadorConfig } from "@/types";

  describe("date helpers", () => {
    it("parses dd/mm/yyyy", () => {
      const d = parseDateStr("15/06/2028")!;
      expect(d.getFullYear()).toBe(2028);
      expect(d.getMonth()).toBe(5); // June, 0-indexed
      expect(d.getDate()).toBe(15);
    });
    it("parses MM/yyyy to last day of month", () => {
      const d = parseDateStr("02/2028")!; // Feb 2028 (leap year) → 29th
      expect(d.getMonth()).toBe(1);
      expect(d.getDate()).toBe(29);
    });
    it("parses Q4 2028 to last day of December", () => {
      const d = parseDateStr("Q4 2028")!;
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(31);
    });
    it("returns null for garbage", () => {
      expect(parseDateStr("not-a-date")).toBeNull();
    });
    it("formatDateDisplay pads to dd/mm/yyyy", () => {
      expect(formatDateDisplay(new Date(2028, 0, 5))).toBe("05/01/2028");
    });
    it("addMonthsToDate rolls the month forward", () => {
      const d = addMonthsToDate(new Date(2028, 10, 1), 3); // Nov + 3 = Feb 2029
      expect(d.getFullYear()).toBe(2029);
      expect(d.getMonth()).toBe(1);
    });
    it("frecuenciaToMonths maps frequencies", () => {
      expect(frecuenciaToMonths("mensual")).toBe(1);
      expect(frecuenciaToMonths("bimestral")).toBe(2);
      expect(frecuenciaToMonths("trimestral")).toBe(3);
      expect(frecuenciaToMonths("unica")).toBe(1);
    });
  });

  describe("paymentRowsFromConfig", () => {
    it("expands a multi-cuota porcentaje phase into individual rows whose pct sums to the phase total", () => {
      const config: CotizadorConfig = {
        moneda: "COP",
        fases: [
          { id: "f1", nombre: "Separación", tipo: "fijo", valor: 5_000_000, cuotas: 1, frecuencia: "unica" },
          { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 3, frecuencia: "mensual" },
          { id: "f3", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
        ],
        descuentos: [],
        separacion_incluida_en_inicial: false,
        notas_legales: null,
      };
      const out = paymentRowsFromConfig(config, 100_000_000);
      // 1 separación + 3 cuota rows + 1 entrega = 5
      expect(out).toHaveLength(5);
      const cuotaRows = out.filter((r) => r.nombre.startsWith("Cuota"));
      expect(cuotaRows).toHaveLength(3);
      const pctSum = cuotaRows.reduce((s, r) => s + r.valor, 0);
      expect(Math.round(pctSum * 100) / 100).toBe(30); // last cuota absorbs rounding
      expect(out[out.length - 1].tipo_valor).toBe("resto");
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/payment-rows.test.ts
  ```
  Confirms `parseDateStr` formats (`payment-rows.ts:28-53`), and the last-cuota-absorbs-rounding expansion (`payment-rows.ts:238-256`).
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/payment-rows.test.ts
  git commit -m "test: lock payment-rows date helpers + config expansion"
  ```

---

## Task 7 — Test: delivery context + phase adjustment (`delivery.ts`)

**Files**
- Test: `src/lib/cotizador/delivery.test.ts` (Create)
- Source under test: `delivery.ts:31-58` (`parseFechaEntrega`), `:94-99` (`calcularMesesRestantes`), `:107-141` (`resolveDeliveryContext`), `:152-196` (`adjustFasesToDelivery`)

### Steps (TDD)

- [ ] Create `src/lib/cotizador/delivery.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    parseFechaEntrega, calcularMesesRestantes, resolveDeliveryContext, adjustFasesToDelivery,
  } from "./delivery";
  import type { CotizadorConfig, FaseConfig } from "@/types";

  describe("parseFechaEntrega", () => {
    it("parses ISO YYYY-MM-DD", () => {
      const d = parseFechaEntrega("2028-12-15")!;
      expect(d.getFullYear()).toBe(2028);
      expect(d.getMonth()).toBe(11);
    });
    it("parses Q2 2028 to last day of June", () => {
      const d = parseFechaEntrega("Q2 2028")!;
      expect(d.getMonth()).toBe(5);
      expect(d.getDate()).toBe(30);
    });
    it("parses MM/yyyy to last day of month", () => {
      const d = parseFechaEntrega("12/2028")!;
      expect(d.getMonth()).toBe(11);
      expect(d.getDate()).toBe(31);
    });
    it("returns null for unsupported strings", () => {
      expect(parseFechaEntrega("soon")).toBeNull();
      expect(parseFechaEntrega(undefined)).toBeNull();
    });
  });

  describe("calcularMesesRestantes", () => {
    it("counts whole months between dates", () => {
      expect(calcularMesesRestantes(new Date(2026, 0, 1), new Date(2028, 0, 1))).toBe(24);
    });
    it("never returns below 1", () => {
      expect(calcularMesesRestantes(new Date(2028, 5, 1), new Date(2026, 0, 1))).toBe(1);
    });
  });

  describe("resolveDeliveryContext", () => {
    it("returns null when tipo_entrega is unset", () => {
      const config = { moneda: "COP", fases: [], descuentos: [], separacion_incluida_en_inicial: false, notas_legales: null } as CotizadorConfig;
      expect(resolveDeliveryContext(config)).toBeNull();
    });
    it("computes months for fecha_fija using a reference date", () => {
      const config = {
        moneda: "COP", fases: [], descuentos: [], separacion_incluida_en_inicial: false, notas_legales: null,
        tipo_entrega: "fecha_fija", fecha_estimada_entrega: "2028-01-01",
      } as CotizadorConfig;
      const ctx = resolveDeliveryContext(config, new Date(2026, 0, 1))!;
      expect(ctx.mesesDisponibles).toBe(24);
    });
    it("uses plazo for plazo_desde_compra", () => {
      const config = {
        moneda: "COP", fases: [], descuentos: [], separacion_incluida_en_inicial: false, notas_legales: null,
        tipo_entrega: "plazo_desde_compra", plazo_entrega_meses: 18,
      } as CotizadorConfig;
      const ctx = resolveDeliveryContext(config, new Date(2026, 0, 1))!;
      expect(ctx.mesesDisponibles).toBe(18);
    });
  });

  describe("adjustFasesToDelivery", () => {
    const fases: FaseConfig[] = [
      { id: "f1", nombre: "Cuotas", tipo: "porcentaje", valor: 40, cuotas: 24, frecuencia: "mensual" },
      { id: "f2", nombre: "Entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
    ];
    it("leaves phases unchanged when they fit", () => {
      const { fases: out, adjustments } = adjustFasesToDelivery(fases, 36);
      expect(out[0].cuotas).toBe(24);
      expect(adjustments).toHaveLength(0);
    });
    it("proportionally reduces cuotas that do not fit, never below 1", () => {
      const { fases: out, adjustments } = adjustFasesToDelivery(fases, 12);
      expect(out[0].cuotas).toBe(12);
      expect(out[1].cuotas).toBe(1); // resto untouched
      expect(adjustments[0]).toMatchObject({ faseId: "f1", originalCuotas: 24, adjustedCuotas: 12 });
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/delivery.test.ts
  ```
  Confirms quarter/month parsing (`delivery.ts:39-56`), `Math.max(1, …)` floor (`delivery.ts:98`), and proportional cuota reduction (`delivery.ts:175-193`).
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/delivery.test.ts
  git commit -m "test: lock delivery context + phase adjustment"
  ```

---

## Task 8 — Test: quick-quote builder + validation (`quick-quote.ts`)

**Files**
- Test: `src/lib/cotizador/quick-quote.test.ts` (Create)
- Source under test: `quick-quote.ts:10-48` (`buildQuickQuoteFases`), `:54-61` (`suggestCuotasFromDelivery`), `:64-79` (`validateQuickQuoteParams`)

### Steps (TDD)

- [ ] Create `src/lib/cotizador/quick-quote.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import {
    buildQuickQuoteFases, suggestCuotasFromDelivery, validateQuickQuoteParams,
  } from "./quick-quote";
  import type { QuickQuoteParams } from "@/types";

  describe("buildQuickQuoteFases", () => {
    it("builds a 3-phase plan whose percentages sum to 100", () => {
      const params: QuickQuoteParams = { separacion_pct: 10, financiacion_pct: 50, cuotas: 12, frecuencia: "mensual" };
      const fases = buildQuickQuoteFases(params);
      expect(fases).toHaveLength(3);
      const pctSum = fases.reduce((s, f) => s + f.valor, 0);
      expect(pctSum).toBe(100); // 10 + 40 (cuotas) + 50
      expect(fases[1].cuotas).toBe(12);
    });
    it("omits separación phase when separacion_pct is 0", () => {
      const params: QuickQuoteParams = { separacion_pct: 0, financiacion_pct: 30, cuotas: 6, frecuencia: "mensual" };
      const fases = buildQuickQuoteFases(params);
      expect(fases.find((f) => f.nombre === "Separación")).toBeUndefined();
    });
  });

  describe("suggestCuotasFromDelivery", () => {
    it("divides months by frequency, floor, min 1", () => {
      expect(suggestCuotasFromDelivery(24, "mensual")).toBe(24);
      expect(suggestCuotasFromDelivery(24, "bimestral")).toBe(12);
      expect(suggestCuotasFromDelivery(24, "trimestral")).toBe(8);
      expect(suggestCuotasFromDelivery(1, "trimestral")).toBe(1);
    });
  });

  describe("validateQuickQuoteParams", () => {
    it("returns no errors for valid params", () => {
      expect(validateQuickQuoteParams({ separacion_pct: 10, financiacion_pct: 40, cuotas: 12, frecuencia: "mensual" })).toEqual([]);
    });
    it("flags separación + financiación over 100", () => {
      const errs = validateQuickQuoteParams({ separacion_pct: 60, financiacion_pct: 50, cuotas: 12, frecuencia: "mensual" });
      expect(errs).toContain("Separación + financiación no puede exceder 100%");
    });
    it("flags cuotas < 1", () => {
      const errs = validateQuickQuoteParams({ separacion_pct: 10, financiacion_pct: 40, cuotas: 0, frecuencia: "mensual" });
      expect(errs).toContain("Debe tener al menos 1 cuota");
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/cotizador/quick-quote.test.ts
  ```
  Confirms `cuotasPct = 100 - sep - fin` (`quick-quote.ts:11`) and the validation messages (`quick-quote.ts:64-79`).
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/cotizador/quick-quote.test.ts
  git commit -m "test: lock quick-quote builder + validation"
  ```

---

## Task 9 — Test: currency format + conversion (`currency.ts`)

**Files**
- Test: `src/lib/currency.test.ts` (Create)
- Source under test: `currency.ts:58-86` (`formatCurrency`), `:100-179` (`convertCurrency`)

### Steps (TDD)

- [ ] Create `src/lib/currency.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";
  import { formatCurrency, convertCurrency } from "./currency";
  import type { ExchangeRate } from "@/types";

  function rate(base: string, target: string, r: number): ExchangeRate {
    return { id: `${base}-${target}`, base_currency: base, target_currency: target, rate: r, fetched_at: "2026-01-01T00:00:00Z", source: "test", created_at: "2026-01-01T00:00:00Z" };
  }

  describe("formatCurrency", () => {
    it("formats COP with no decimals", () => {
      // Non-breaking spaces / grouping vary by ICU; assert digits + symbol presence
      const s = formatCurrency(1_500_000, "COP");
      expect(s).toContain("$");
      expect(s.replace(/\D/g, "")).toBe("1500000");
    });
    it("compacts millions when compact:true", () => {
      expect(formatCurrency(1_500_000, "COP", { compact: true })).toBe("$1.5M");
      expect(formatCurrency(2_000_000_000, "USD", { compact: true })).toBe("$2.0B");
    });
    it("honours decimalPlaces override", () => {
      const s = formatCurrency(150.5, "USD", { decimalPlaces: 2 });
      expect(s).toContain("150.50");
    });
  });

  describe("convertCurrency", () => {
    it("returns identity for same currency", () => {
      const r = convertCurrency(100, "USD", "USD", []);
      expect(r.amount).toBe(100);
      expect(r.rate).toBe(1);
    });
    it("uses a direct rate", () => {
      const r = convertCurrency(100, "USD", "COP", [rate("USD", "COP", 4200)]);
      expect(r.amount).toBe(420_000);
      expect(r.rate).toBe(4200);
    });
    it("inverts a reverse rate", () => {
      const r = convertCurrency(4200, "COP", "USD", [rate("USD", "COP", 4200)]);
      expect(r.amount).toBeCloseTo(1, 6);
    });
    it("cross-rates via USD", () => {
      const r = convertCurrency(100, "EUR", "COP", [rate("USD", "EUR", 0.9), rate("USD", "COP", 4500)]);
      // crossRate = toUSD.rate / fromUSD.rate = 4500 / 0.9 = 5000
      expect(r.amount).toBeCloseTo(500_000, 0);
      expect(r.rate).toBeCloseTo(5000, 6);
    });
    it("falls back to identity when no rate found", () => {
      const r = convertCurrency(100, "EUR", "AED", []);
      expect(r.amount).toBe(100);
      expect(r.rate).toBe(1);
    });
  });
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/lib/currency.test.ts
  ```
  Confirms compact notation (`currency.ts:72-77`), direct/reverse/cross resolution (`currency.ts:118-166`) and the identity fallback (`currency.ts:169-178`). NOTE: the digit-only assertion avoids ICU locale-separator differences between local and CI runners.
- [ ] Source step: NONE.
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/lib/currency.test.ts
  git commit -m "test: lock currency format + conversion"
  ```

---

## Task 10 — A11y: associate form labels in `ContactForm.tsx` (WCAG 1.3.1 / 3.3.2) + close-button name (4.1.2)

> If DECISION GATE = "no new deps", keep the source edits below but replace the jsdom test with the manual axe check at the end of this task.

**Files**
- Modify: `src/components/marketing/ContactForm.tsx` (labels at `:410-422`, `:424-437`, `:484-498`, `:501-535`, `:614-651`; close buttons at `:279-286`, `:372-379`)
- Modify: `src/components/marketing/ContactForm.tsx:138-149` (`FocusInput` — forward an `id`)
- Test: `src/components/marketing/ContactForm.test.tsx` (Create)

### Steps (TDD)

- [ ] Write failing test `src/components/marketing/ContactForm.test.tsx`:
  ```tsx
  // @vitest-environment jsdom
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import { ContactForm } from "./ContactForm";

  describe("ContactForm accessibility", () => {
    it("associates the Nombre label with its input", () => {
      render(<ContactForm />);
      // getByLabelText throws if no programmatic label association exists
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("exposes an accessible name on the close button", () => {
      render(<ContactForm onClose={() => {}} />);
      expect(screen.getByRole("button", { name: /cerrar formulario/i })).toBeInTheDocument();
    });
  });
  ```
- [ ] Run, expect FAIL:
  ```bash
  npx vitest run src/components/marketing/ContactForm.test.tsx
  ```
  Expected: FAILS — `getByLabelText(/nombre/i)` throws "Unable to find a label", and the close button has no accessible name.
- [ ] Implement. First make `FocusInput` forward an `id` (it already spreads `...rest`, so `id` flows through — but add explicit typing is unnecessary; `id` is part of `InputHTMLAttributes`). No change needed to `FocusInput`. Then add `htmlFor`/`id` pairs. Replace the Step-1 Nombre block (`ContactForm.tsx:410-422`):
  ```tsx
              <div>
                <label
                  htmlFor="cf-name"
                  className="block text-[10px] font-ui font-bold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: "rgba(244,240,232,0.4)" }}
                >
                  Nombre
                </label>
                <FocusInput
                  id="cf-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  autoFocus
                  aria-required="true"
                />
              </div>
  ```
- [ ] Replace the Email block (`ContactForm.tsx:424-437`) — add `htmlFor="cf-email"` to the label and `id="cf-email" aria-required="true"` to its `FocusInput`. Apply the same `htmlFor`/`id` pattern to: Empresa (`:484-498`, id `cf-company`), Teléfono `FocusInput` (`:528-534`, id `cf-phone` + label `htmlFor="cf-phone"` at `:502-507`), and the message `textarea` (`:638-650`, id `cf-message` + label `htmlFor="cf-message"` at `:632-637`). (The plan/projectCount fields use `NodDoDropdown`, which is a custom control — leave those; they are not native inputs and the visible label text suffices for this pass.)
- [ ] Add accessible names to both close buttons. Replace the success-state close button (`ContactForm.tsx:280-285`):
  ```tsx
          <button
            onClick={onClose}
            aria-label="Cerrar formulario"
            className="absolute top-4 right-4 text-[rgba(244,240,232,0.3)] hover:text-[rgba(244,240,232,0.7)] transition-colors"
          >
            <X size={20} aria-hidden="true" />
          </button>
  ```
  Apply the identical `aria-label="Cerrar formulario"` + `aria-hidden="true"` change to the wizard close button (`ContactForm.tsx:373-378`).
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/components/marketing/ContactForm.test.tsx
  ```
  Expected: both cases green.
- [ ] (No-deps fallback verification, only if Vitest declined) Manual axe check:
  ```bash
  npm run dev
  # In a browser at http://localhost:3000, open the contact modal, run axe DevTools
  # on the dialog; expect 0 violations for "form-field-multiple-labels" / "button-name".
  ```
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/components/marketing/ContactForm.tsx src/components/marketing/ContactForm.test.tsx
  git commit -m "fix: associate ContactForm labels + name close buttons (WCAG 1.3.1/4.1.2)"
  ```

---

## Task 11 — A11y: hamburger ARIA state + skip link in `MarketingNav.tsx` (WCAG 4.1.2 / 2.4.1)

> No-deps fallback: keep source edits; replace jsdom test with the manual keyboard check at the end.

**Files**
- Modify: `src/components/marketing/MarketingNav.tsx` (hamburger button `:227-249`, mobile menu container `:255-267`, add skip link inside the returned `<motion.header>` at `:126-139`)
- Modify: `src/app/globals.css` (add `.skip-link` + `.sr-only` rules near the focus block at `:800`)
- Modify: `src/app/(marketing)/layout.tsx:` main element — add `id="main-content"` (currently `<main className="relative z-[1]">{children}</main>`)
- Test: `src/components/marketing/MarketingNav.test.tsx` (Create)

### Steps (TDD)

- [ ] Write failing test `src/components/marketing/MarketingNav.test.tsx`:
  ```tsx
  // @vitest-environment jsdom
  import { describe, it, expect } from "vitest";
  import { render, screen, fireEvent } from "@testing-library/react";
  import { MarketingNav } from "./MarketingNav";

  describe("MarketingNav accessibility", () => {
    it("renders a skip link targeting #main-content", () => {
      render(<MarketingNav />);
      const skip = screen.getByRole("link", { name: /contenido principal/i });
      expect(skip).toHaveAttribute("href", "#main-content");
    });

    it("toggles aria-expanded on the mobile menu button", () => {
      render(<MarketingNav />);
      const btn = screen.getByRole("button", { name: /menú/i });
      expect(btn).toHaveAttribute("aria-expanded", "false");
      fireEvent.click(btn);
      expect(btn).toHaveAttribute("aria-expanded", "true");
    });
  });
  ```
  NOTE: `MarketingNav` imports `useBooking` (from `BookingProvider`) and `useTranslation` (`@/i18n`). If `useBooking` requires a provider, the render will throw. Before running, check whether those hooks read from a default-safe context. If `useBooking` throws without a provider, wrap render in the provider:
  ```tsx
  import { BookingProvider } from "./BookingProvider";
  // render(<BookingProvider><MarketingNav /></BookingProvider>);
  ```
  Use whichever form makes the component mount; the assertions are unchanged. (Verify `BookingProvider`'s export name first by reading `src/components/marketing/BookingProvider.tsx`.)
- [ ] Run, expect FAIL:
  ```bash
  npx vitest run src/components/marketing/MarketingNav.test.tsx
  ```
  Expected: FAILS — no skip link exists, and the hamburger button has `aria-label="Toggle menu"` with no `aria-expanded`.
- [ ] Implement the hamburger button (`MarketingNav.tsx:227-232`):
  ```tsx
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden flex flex-col gap-1.5 p-2 min-w-[44px] min-h-[44px] items-center justify-center hover:bg-[rgba(255,255,255,0.05)] active:bg-[rgba(255,255,255,0.1)] rounded transition-colors"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
  ```
- [ ] Give the mobile menu container an id + role. On the `<motion.div>` at `MarketingNav.tsx:256`, add `id="mobile-nav" role="navigation" aria-label="Navegación móvil"` props (alongside the existing `initial`/`animate`/`exit`).
- [ ] Add the skip link as the first child inside `<motion.header>`, immediately before `<nav …>` (`MarketingNav.tsx:139`):
  ```tsx
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
  ```
- [ ] Add `id="main-content"` to the layout `<main>` in `src/app/(marketing)/layout.tsx` (the line `<main className="relative z-[1]">{children}</main>`):
  ```tsx
          <main id="main-content" className="relative z-[1]">{children}</main>
  ```
- [ ] Add `.skip-link` + `.sr-only` to `globals.css` immediately after the `:focus-visible` block (`globals.css:805`):
  ```css
  /* ====== SKIP LINK + SR-ONLY ====== */
  .skip-link {
    position: absolute;
    top: -100px;
    left: 0;
    z-index: 999999;
    padding: 12px 24px;
    background: var(--noddo-primary);
    color: #141414;
    font-weight: 600;
    text-decoration: none;
    border-radius: 0 0 8px 0;
    transition: top 0.2s ease;
  }
  .skip-link:focus {
    top: 0;
    outline: 2px solid var(--noddo-primary);
    outline-offset: 2px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  ```
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/components/marketing/MarketingNav.test.tsx
  ```
  Expected: both cases green (skip link present + `href="#main-content"`; `aria-expanded` toggles `false`→`true`).
- [ ] (No-deps fallback verification) Manual keyboard check:
  ```bash
  npm run dev
  # At http://localhost:3000 press Tab once from page load → the skip link should
  # appear top-left; Enter jumps focus to <main id="main-content">. On a narrow
  # viewport, Tab to the hamburger and confirm screen reader announces expanded state.
  ```
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/components/marketing/MarketingNav.tsx "src/app/(marketing)/layout.tsx" src/app/globals.css src/components/marketing/MarketingNav.test.tsx
  git commit -m "fix: hamburger aria-expanded + skip link + sr-only utility (WCAG 4.1.2/2.4.1)"
  ```

---

## Task 12 — A11y: text-contrast tokens + reduced-motion opt-out in `CustomCursor` (WCAG 1.4.3 / 2.3.3)

This task is CSS/behaviour-only (no meaningful unit test); verification is via concrete contrast math + a manual reduced-motion check.

**Files**
- Modify: `src/app/globals.css:44-45` (`--text-tertiary`, `--text-muted`)
- Modify: `src/components/marketing/CustomCursor.tsx:5-21` (honour `prefers-reduced-motion`)

### Steps

- [ ] Raise the two low-contrast tokens. Replace `globals.css:44-45`:
  ```css
    --text-tertiary: rgba(244, 240, 232, 0.60); /* ~7:1 on near-black — was 0.35 (~2.8:1) */
    --text-muted: rgba(244, 240, 232, 0.40);    /* ~4.6:1 — was 0.18 (~1.5:1) */
  ```
- [ ] Verify the new contrast ratios with a quick computation (paper `#F4F0E8` text on base `#0A0A0B`, alpha-composited over the base):
  ```bash
  node -e '
  const fg=[244,240,232], bg=[10,10,11];
  const lin=c=>{c/=255;return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
  const L=rgb=>0.2126*lin(rgb[0])+0.7152*lin(rgb[1])+0.0722*lin(rgb[2]);
  for(const a of [0.40,0.60]){
    const comp=fg.map((c,i)=>Math.round(c*a+bg[i]*(1-a)));
    const l1=L(comp), l2=L(bg);
    const ratio=(Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    console.log("alpha",a,"=>",ratio.toFixed(2)+":1");
  }'
  ```
  Expected output: `alpha 0.4 => ~4.6:1` (passes AA for normal text) and `alpha 0.6 => ~7:1` (passes AAA). If `--text-muted` (0.40) lands just under 4.5:1 on a given surface, bump to `0.45` and re-run.
- [ ] Add a reduced-motion opt-out to `CustomCursor.tsx`. The component already returns `null` on touch and uses `pointer-events-none`, so it cannot trap keyboard focus — but it should not animate for users who prefer reduced motion. Replace the state init + first effect (`CustomCursor.tsx:10-18`):
  ```tsx
    // Always start true (render nothing) to match server HTML and avoid hydration mismatch
    const [isTouch, setIsTouch] = useState(true);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
      const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
      setIsTouch(!mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsTouch(!e.matches);
      mq.addEventListener("change", handler);

      const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReduceMotion(rm.matches);
      const rmHandler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
      rm.addEventListener("change", rmHandler);

      return () => {
        mq.removeEventListener("change", handler);
        rm.removeEventListener("change", rmHandler);
      };
    }, []);
  ```
  Then change the early-return guard (`CustomCursor.tsx:83`) from `if (isTouch) return null;` to:
  ```tsx
    if (isTouch || reduceMotion) return null;
  ```
  And add `reduceMotion` to nothing else (the animation effect already early-returns when `isTouch`; with the render guard above it never mounts the refs when reduceMotion is on, so the effect's `dotRef.current`/`ringRef.current` will be null and it returns early — safe). To be explicit, also update the animation effect's guard at `CustomCursor.tsx:21` from `if (isTouch) return;` to `if (isTouch || reduceMotion) return;` and add `reduceMotion` to that effect's dependency array (`CustomCursor.tsx:81`: `}, [isTouch, reduceMotion]);`).
- [ ] Verify typecheck/lint catch nothing and run the suite (the existing tests still pass; this file has no dedicated test):
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all green.
- [ ] Manual reduced-motion check:
  ```bash
  npm run dev
  # In Chrome DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce".
  # Reload http://localhost:3000 → the custom cursor dot/ring must NOT render
  # (native cursor only). Disable emulation → custom cursor returns.
  ```
- [ ] Commit:
  ```bash
  git add src/app/globals.css src/components/marketing/CustomCursor.tsx
  git commit -m "fix: raise text-contrast tokens + reduced-motion cursor opt-out (WCAG 1.4.3/2.3.3)"
  ```

---

## Task 13 — A11y: dialog semantics + focus trap on `ContactModal` (WCAG 2.1.2 / 4.1.2)

> DECISION GATE: The audit suggested `focus-trap-react`. To avoid a new runtime dependency, this task implements a **native focus trap in plain React** (no new dep). If the owner explicitly prefers `focus-trap-react`, the alternate branch is given at the end. Default = native implementation.

**Files**
- Modify: `src/components/marketing/ContactModal.tsx:43-81` (add `role="dialog"`, `aria-modal`, `aria-label`, and a Tab-key focus trap)
- Test: `src/components/marketing/ContactModal.test.tsx` (Create) — covered by jsdom; if no-deps fallback, replace with manual keyboard check.

### Steps (TDD)

- [ ] Write failing test `src/components/marketing/ContactModal.test.tsx`. Because `ContactModal` reads `useContact()` and only renders when `isContactOpen`, we test through the `ContactProvider` and open it. First read `src/components/marketing/ContactProvider.tsx` to confirm the provider export + how to open (an `openContact` action). Then:
  ```tsx
  // @vitest-environment jsdom
  import { describe, it, expect } from "vitest";
  import { render, screen } from "@testing-library/react";
  import { ContactProvider, useContact } from "./ContactProvider";
  import { ContactModal } from "./ContactModal";

  function Opener() {
    const { openContact } = useContact();
    return <button onClick={() => openContact()}>open</button>;
  }

  describe("ContactModal accessibility", () => {
    it("exposes a dialog with aria-modal when open", async () => {
      const { default: userEventModule } = await import("@testing-library/user-event");
      const user = userEventModule.setup();
      render(
        <ContactProvider>
          <Opener />
          <ContactModal />
        </ContactProvider>,
      );
      await user.click(screen.getByText("open"));
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });
  ```
  NOTE: this needs `@testing-library/user-event` — add it to the Task 0 install list (`npm install -D @testing-library/user-event@^14`). If you prefer zero extra deps, drive the open via `fireEvent.click` instead and drop the dynamic import. Confirm `useContact`'s open action name by reading `ContactProvider.tsx` before finalizing (it may be `openContact(plan?, source?)`).
- [ ] Run, expect FAIL:
  ```bash
  npx vitest run src/components/marketing/ContactModal.test.tsx
  ```
  Expected: FAILS — the modal panel `<motion.div>` has no `role="dialog"`/`aria-modal`.
- [ ] Implement. Add a `useRef` for the panel and a Tab-trap handler. Replace the modal-panel `<motion.div>` opening (`ContactModal.tsx:63-70`) so it carries dialog semantics and a ref, and extend the existing keydown effect to trap Tab. Concretely:
  - Add at top of component body (after `const [mountKey, …]` at `ContactModal.tsx:10`):
    ```tsx
    const panelRef = useRef<HTMLDivElement>(null);
    ```
    and add `useRef` to the React import (`ContactModal.tsx:3`): `import { useEffect, useRef, useState, useCallback } from "react";`
  - Extend `handleKeyDown` (`ContactModal.tsx:29-34`) to also trap Tab:
    ```tsx
    const handleKeyDown = useCallback(
      (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          closeContact();
          return;
        }
        if (e.key !== "Tab" || !panelRef.current) return;
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      },
      [closeContact],
    );
    ```
  - Add dialog attributes + ref to the panel `<motion.div>` (`ContactModal.tsx:63-69`): add `ref={panelRef}`, `role="dialog"`, `aria-modal="true"`, `aria-label="Formulario de contacto"` alongside the existing props.
- [ ] Run, expect PASS:
  ```bash
  npx vitest run src/components/marketing/ContactModal.test.tsx
  ```
  Expected: green (dialog role + aria-modal present).
- [ ] (No-deps fallback verification) Manual keyboard check:
  ```bash
  npm run dev
  # Open the contact modal, press Tab repeatedly → focus must cycle within the
  # modal (never reaching nav/page behind it); Shift+Tab from the first element
  # wraps to the last; Escape closes.
  ```
- [ ] Verify gate + commit:
  ```bash
  npm run typecheck && npm run lint && npm test
  git add src/components/marketing/ContactModal.tsx src/components/marketing/ContactModal.test.tsx
  git commit -m "fix: dialog semantics + Tab focus trap on ContactModal (WCAG 2.1.2/4.1.2)"
  ```

#### ALTERNATE (owner prefers `focus-trap-react`)
- [ ] `npm install -D focus-trap-react@^11` (or as a runtime dep if preferred).
- [ ] Wrap the panel `<motion.div>` in `<FocusTrap focusTrapOptions={{ escapeDeactivates: true, clickOutsideDeactivates: true, returnFocusOnDeactivate: true }}>` and keep `role="dialog" aria-modal="true" aria-label="Formulario de contacto"` on the panel. Remove the manual Tab branch from `handleKeyDown` (keep Escape). Same test asserts `role="dialog"` + `aria-modal`.

---

## Task dependency / order

```
Task 0  (Vitest + CI)  ── must run FIRST; gates everything else
   ├─ Tasks 1–4  (calcular.ts tests)        ── independent, same file, do in order 1→4
   ├─ Tasks 5–6  (payment-rows.ts tests)    ── independent of 1–4
   ├─ Task 7     (delivery.ts tests)        ── independent
   ├─ Task 8     (quick-quote.ts tests)     ── independent
   ├─ Task 9     (currency.ts tests)        ── independent
   ├─ Task 10    (ContactForm a11y)         ── independent (needs jsdom from Task 0)
   ├─ Task 11    (MarketingNav a11y)        ── independent
   ├─ Task 12    (contrast + cursor a11y)   ── pure CSS/behaviour, no Task-0 dep for the edits,
   │                                            but commit after Task 0 so `npm test` exists in the gate
   └─ Task 13    (ContactModal focus trap)  ── independent (needs jsdom + maybe user-event from Task 0)
```

- Tasks 1–9 are pure-math tests and can be parallelized across worktrees if desired (all add new files only; no shared source edits). Tasks 10–13 each edit distinct components, so they also do not conflict — except both Task 11 and Task 12 touch `src/app/globals.css`; run them sequentially (11 then 12) or rebase carefully to avoid a merge conflict in that file.
- Final: open a PR from `fix/quality-tests-a11y` → `dev`. Do NOT merge to `main` without explicit owner approval (WORKFLOW.md). CI on the PR will now run typecheck + lint + `npm test` + build.

## Per-task effort estimate

| Task | Description | Effort |
|------|-------------|--------|
| 0 | Vitest install + config + CI wiring | 0.5d |
| 1 | calcular: discounts + phase math | 0.5d |
| 2 | calcular: separación deduction | 0.25d |
| 3 | calcular: complementos + cargos | 0.5d |
| 4 | calcular: buildPrecioBaseComplementos | 0.25d |
| 5 | payment-rows: resolution + balance | 0.5d |
| 6 | payment-rows: dates + expansion | 0.5d |
| 7 | delivery: context + adjustment | 0.5d |
| 8 | quick-quote: builder + validation | 0.25d |
| 9 | currency: format + conversion | 0.5d |
| 10 | ContactForm labels + close-button names | 0.5d |
| 11 | MarketingNav aria-expanded + skip link | 0.5d |
| 12 | Contrast tokens + reduced-motion cursor | 0.25d |
| 13 | ContactModal dialog + focus trap | 0.5d |

**Total: ~6 days** (financial-engine tests + CI ~4d; accessibility ~1.75d), assuming one engineer. Tasks 1–9 compress to ~2d if the characterization tests pass on first run (expected, since they lock existing verified behavior).
