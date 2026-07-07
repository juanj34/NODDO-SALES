# Etapa-Plans (Delivery Calculator by phase-name) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Make the delivery calculator resolve each unit's payment plan from its PHASE (`unidades.etapa_nombre`, a per-unit string like "1".."4") instead of the torre entity — because a project is one urbanismo with temporal phases, not separate towers. Each phase carries fecha_entrega + plan (% inicial, separación), configured per project. Reproduces Índigo's E1/E2 exactly; phases without a plan (E3/E4) fall back gracefully.

**Context / why:** The shipped calculator (main f90684b) reads fecha+plan from `torres` via `torre_id`. Índigo (tipo_proyecto=lotes) models phases as `etapa_nombre` strings; only some units have a torre. So the calculator is inert for it. This extension adds phase-name resolution + a new separación type "% of the cuota inicial".

**Approach:** No migration. Phase plans live in `cotizador_config.etapas_plan` (jsonb array keyed by phase name) — the config is already fetched by CotizadorTool and included in the published snapshot. The deployed torre fields stay as a fallback (tower projects). Adds separación type `"porcentaje_inicial"`.

**Tech Stack:** Next 16 / React 19 / TS strict / vitest (TDD for the lib).

## Global Constraints

- TS strict, no `any`, no lint-suppression. Gate: `npx tsc --noEmit -p tsconfig.json` + `npm run lint` (0 errors, 0 NEW warnings; ~121 baseline) + `CI=true npx vitest run` fully green.
- Worktree C:/repos/noddo-wt/agent-only, branch feat/etapa-plans (off origin/main f90684b). node_modules is a junction — never npm install.
- Commits: `-c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com"` + trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Real data for tests (Índigo, quote month = 2026-07): **E1** casas 1-13: pct_inicial 30, separación fijo 15,000,000, fecha_entrega 2028-01-01 → N=18, para casa $670M: inicial=201,000,000, sep 15,000,000, resto-inicial=186,000,000, cuota=round(186,000,000/18)=10,333,333, financiación 469,000,000. **E2** casas 14-25: pct_inicial 50, separación **porcentaje_inicial 5**, fecha_entrega 2029-01-01 → N=30, para casa $670M: inicial=335,000,000, sep=round(335,000,000*5/100)=16,750,000, resto-inicial=318,250,000, cuota=round(318,250,000/30)=10,608,333, financiación 335,000,000. Month rule (existing): N=(eY-qY)*12+(eM-qM), clamp≥0; 2026-07→2028-01 = 18, →2029-01 = 30.

---

### Task 1: types + delivery-calc phase resolution + porcentaje_inicial separación (TDD)

**Files:**
- Modify: `src/types/index.ts` (add `EtapaPlanConfig`; add `etapas_plan?: EtapaPlanConfig[]` to `CotizadorConfig`; widen separación tipo union)
- Modify: `src/lib/cotizador/delivery-calc.ts`
- Modify: `src/lib/cotizador/__tests__/delivery-calc.test.ts`

**Interfaces produced (consumed by Task 2 — exact names):**
```ts
export interface EtapaPlanConfig {
  nombre: string;                 // matches unidades.etapa_nombre
  fecha_entrega: string | null;   // ISO date, drives N
  pct_inicial: number;
  separacion_tipo: "porcentaje" | "porcentaje_inicial" | "fijo";
  separacion_valor: number;       // 15000000 (fijo) | 5 (%inicial) | 2.5 (%total)
  tipo_entrega?: "fecha_fija" | "plazo_desde_compra" | null;
  plazo_meses?: number | null;
}
// resolveEtapaPlan signature CHANGES — new first param:
export function resolveEtapaPlan(
  etapaPlan: EtapaPlanConfig | null,
  torre: TorrePlanFields | null,
  config: CotizadorConfig | null | undefined,
): EtapaPlan;
// helper for callers:
export function findEtapaPlan(etapaNombre: string | null, config: CotizadorConfig | null | undefined): EtapaPlanConfig | null;
```

- [ ] **Step 1.1:** Add `EtapaPlanConfig` + `CotizadorConfig.etapas_plan?`; widen the separación tipo union (`EtapaPlan.separacionTipo`, and the torres field type `plan_separacion_tipo` in Torre) to include `"porcentaje_inicial"`. Run tsc; fix any exhaustive switch/Torre literal.
- [ ] **Step 1.2 (TDD RED):** Add `findEtapaPlan` + change `resolveEtapaPlan` per the signature. Precedence: `etapaPlan` (fuente "etapa") → `torre` fields (fuente "etapa") → `config.calc_defaults` (fuente "proyecto") → builtins (50 / porcentaje / 2.5). `fechaEntrega`: etapaPlan → torre → config.fecha_estimada_entrega → null. `fuente="incompleta"` when resolved `tipoEntrega==="fecha_fija" && !fechaEntrega` (takes precedence over "etapa" — keep the Task-2-fix ordering already in the file). In `buildDeliveryPlan`, add the separación case: `separacionPesos = separacionTipo==="fijo" ? Math.round(valor) : separacionTipo==="porcentaje_inicial" ? Math.round(inicialPesos*valor/100) : Math.round(total*valor/100)`. Write tests FIRST asserting the E1 and E2 real numbers above (RED), plus: findEtapaPlan matches by nombre / returns null when absent; a phase with no plan + no fecha → fuente "incompleta"; porcentaje_inicial math; backward compat (existing tests with the OLD 2-arg resolveEtapaPlan call must be updated to pass `null` as the new first arg — update them, they still assert the same torre/fallback behavior).
- [ ] **Step 1.3 (GREEN):** implement, `CI=true npx vitest run src/lib/cotizador` fully green, tsc, lint 0 new.
- [ ] **Step 1.4:** commit `feat(cotizador): resolución de plan por etapa (nombre) + separación '% de la inicial' (TDD)`.

---

### Task 2: settings UI (Etapas) + CotizadorTool/DeliveryCalculator wiring

**Files:**
- Modify: `src/components/dashboard/cotizador/PlantillaEditor.tsx` (add an "Etapas" section editing `cotizador_config.etapas_plan`)
- Modify: `src/components/dashboard/cotizador/CotizadorTool.tsx` (resolve unit's etapa_nombre → EtapaPlanConfig; pass to DeliveryCalculator)
- Modify: `src/components/dashboard/cotizador/DeliveryCalculator.tsx` (accept the resolved `etapaPlan` prop; use it via the new resolveEtapaPlan)

**Consumes:** Task 1's `EtapaPlanConfig`, `findEtapaPlan`, `resolveEtapaPlan(etapaPlan, torre, config)`.

- [ ] **Step 2.1: Etapas settings.** In PlantillaEditor (where `cotizador_config` is edited — Task-5 added the calc_defaults section there), add an "Etapas / fases" section. It should auto-discover the phase names present in the project (the component already has access to the project's unidades OR pass the distinct etapa_nombre list in; if not available, read from a prop/existing data — inspect what PlantillaEditor receives). For each phase name, a row to set: fecha_entrega (date), % inicial (number), separación tipo (select: % del total | % de la inicial | monto fijo) + valor. Persist as `config.etapas_plan` (array of `EtapaPlanConfig`) via the existing `saveConfig`. Phases left blank simply have no entry (calculator falls back / shows incompleta). Follow the file's existing Spanish-literal + input styles.
- [ ] **Step 2.2: DeliveryCalculator prop.** Add `etapaPlan: EtapaPlanConfig | null` to `DeliveryCalculatorProps`; pass it into `resolveEtapaPlan(etapaPlan, torre, config)` (replacing the current 2-arg call). No other behavior change (overrides, incompleta block, emit effect stay).
- [ ] **Step 2.3: CotizadorTool wiring.** Resolve the selected unit's phase plan: `const etapaPlan = findEtapaPlan(selectedUnit?.etapa_nombre ?? null, config);` and pass `etapaPlan={etapaPlan}` to `<DeliveryCalculator>`. Ensure `UnitRow`/unit type exposes `etapa_nombre` (it's on `/api/unidades` select *; type it if missing). The default-mode logic (calculadora when `fuente !== "incompleta"`) now benefits from etapaPlan — verify it still computes from the resolved plan.
- [ ] **Step 2.4:** gate (tsc + lint 0 new + vitest green) + commit `feat(cotizador): UI de etapas (fecha+plan por fase) y wiring de la calculadora por etapa_nombre`.

---

### Task 3 (controller): review, deploy, configure Índigo, E2E

- [ ] Whole-branch review (opus) → fix wave if needed → deploy checkpoint with Master → cherry-pick to main → deploy → verify READY.
- [ ] Configure Índigo `cotizador_config.etapas_plan` via API (Supabase Management API on the LIVE proyectos row AND the published snapshot; purge Vercel data cache):
  ```json
  [ {"nombre":"1","fecha_entrega":"2028-01-01","pct_inicial":30,"separacion_tipo":"fijo","separacion_valor":15000000,"tipo_entrega":"fecha_fija"},
    {"nombre":"2","fecha_entrega":"2029-01-01","pct_inicial":50,"separacion_tipo":"porcentaje_inicial","separacion_valor":5,"tipo_entrega":"fecha_fija"} ]
  ```
  (E3/E4 intentionally omitted — no plan.)
- [ ] E2E: quote one E1 casa ($670M → 18 cuotas of 10,333,333, sep 15,000,000) and one E2 casa ($670M → 30 cuotas of 10,608,333, sep 16,750,000) through the real flow; confirm the on-screen calc + PDF match; confirm an E3 casa shows the "sin plan" fallback. Screenshot PDF for Master. Closes the pending cotización-PDF e2e.
