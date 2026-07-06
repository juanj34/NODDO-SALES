# Delivery Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Delivery-driven quote calculator: unit → etapa → (fecha_entrega + plan) → separación + N equal monthly cuotas (N = months to delivery, auto-shrinking) + financiación resto — matching BTO's Excel exactly, as a new default mode beside templates.

**Architecture:** Additive per-etapa columns on `torres`; a pure tested lib (`delivery-calc.ts`) that counts Bogota-calendar months and builds `FaseConfig[]` for the EXISTING engine path (`custom_fases` + `separacion_incluida_en_inicial` + `FaseConfig.cuotas` equal-cuota support); a `DeliveryCalculator` panel component wired into `CotizadorTool` via a mode toggle; PDF grouping + extras band; one API bug fix (`precio_negociado`).

**Tech Stack:** Next.js 16 / React 19 / TS strict / Supabase / vitest (exists — TDD required for lib + PDF tasks).

**Spec:** `docs/superpowers/specs/2026-07-06-delivery-calculator-design.md` (same branch — read it first).

## Global Constraints

- TS strict; no `any`; no lint-suppression comments. Gate: `npx tsc --noEmit -p tsconfig.json` + `npm run lint` (0 errors, 0 NEW warnings; ~123 baseline). Tests: `npx vitest run src/lib/cotizador` must stay green (24 pre-existing + new).
- Worktree C:/repos/noddo-wt/agent-only, branch `feat/delivery-calculator` (off origin/main 6560715). node_modules is a junction — never npm install.
- Commits: `-c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com"`, trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Money is integer pesos (COP decimals=0). The engine keeps `monto_total` exact; per-cuota display value = `Math.round(monto_total/cuotas)` (existing behavior — do not change).
- Reference numbers (tests MUST use these): Índigo E2 675,000,000 → sep 16,875,000 · 23 × 13,940,217 · resto 337,500,000. Garden 945,000,000 → sep 23,625,000 · 26 × 17,264,423 · resto 472,500,000. Índigo E1 "3070": pct_inicial 30.

---

### Task 1: Schema + types + torres API + etapa editor fields

**Files:**
- Create: `supabase/migrations/20260722000000_torres_entrega_plan.sql`
- Modify: `src/types/index.ts` (~line 473 `interface Torre`; `CotizadorConfig` ~line 850-930)
- Modify: `src/app/api/torres/route.ts` + `src/app/api/torres/[id]/route.ts` (pick whitelists)
- Modify: `src/app/(dashboard)/editor/[id]/torres/page.tsx` (etapa card: fecha + plan fields)

**Interfaces produced (later tasks rely on these exact names):**
```ts
// Torre additions (all nullable)
fecha_entrega: string | null;              // ISO date "2028-06-01"
plan_pct_inicial: number | null;           // e.g. 50, 30
plan_separacion_tipo: "porcentaje" | "fijo" | null;
plan_separacion_valor: number | null;      // 2.5 (pct) or 16875000 (fijo)
// CotizadorConfig additions (jsonb, optional)
calc_defaults?: { pct_inicial: number; separacion_tipo: "porcentaje" | "fijo"; separacion_valor: number };
leasing_nota?: string; parqueaderos_label?: string; acabados_nota?: string; bonos_nota?: string; vigencia_dias?: number;
```

- [ ] Migration content:
```sql
-- Per-etapa delivery date + payment plan params for the delivery calculator.
alter table torres
  add column if not exists fecha_entrega date,
  add column if not exists plan_pct_inicial numeric,
  add column if not exists plan_separacion_tipo text check (plan_separacion_tipo in ('porcentaje','fijo')),
  add column if not exists plan_separacion_valor numeric;
```
- [ ] Add the Torre + CotizadorConfig fields (doc comments per spec). Run tsc; fix any Torre literals the compiler flags (add nulls).
- [ ] Add the 4 new torre fields to both torres API pick whitelists (POST insert + PUT update).
- [ ] Torres editor page: in each torre/etapa card form add a "Entrega y plan de pagos" section: date input `fecha_entrega`, number `plan_pct_inicial` (label "% cuota inicial"), select `plan_separacion_tipo` (Porcentaje/Monto fijo), number `plan_separacion_valor`. Follow the page's existing form patterns/styles exactly (read neighboring fields). All optional (nullable) with placeholder "usa el default del proyecto".
- [ ] Gate + commit `feat(etapas): fecha de entrega + plan de pagos por etapa (schema, API, editor)`.

---

### Task 2: `delivery-calc.ts` — pure lib (STRICT TDD)

**Files:**
- Create: `src/lib/cotizador/delivery-calc.ts`
- Create: `src/lib/cotizador/__tests__/delivery-calc.test.ts`

**Interfaces produced:**
```ts
export interface EtapaPlan {
  pctInicial: number;                       // e.g. 50
  separacionTipo: "porcentaje" | "fijo";
  separacionValor: number;                  // pct value or pesos
  fechaEntrega: string | null;              // ISO date
  tipoEntrega: "fecha_fija" | "plazo_desde_compra";
  plazoMeses: number | null;                // for plazo_desde_compra
  fuente: "etapa" | "proyecto" | "incompleta"; // where params came from
}
export interface DeliveryPlanResult {
  cuotas: number;                           // N (>=0)
  separacionPesos: number;                  // resolved integer pesos
  inicialPesos: number;                     // round(total*pct/100)
  cuotaMensualPesos: number;                // round((inicial-sep)/N), 0 when N===0
  financiacionPesos: number;                // total - inicial
  fases: FaseConfig[];                      // ready for custom_fases
  contado: boolean;                         // N<=0 → inicial single payment
}
export function monthsUntilDelivery(quoteDateISO: string, fechaEntregaISO: string): number;
export function resolveEtapaPlan(torre: Pick<Torre,"fecha_entrega"|"plan_pct_inicial"|"plan_separacion_tipo"|"plan_separacion_valor"> | null, config: CotizadorConfig | null | undefined): EtapaPlan;
export function buildDeliveryPlan(totalPesos: number, plan: EtapaPlan, quoteDateISO: string): DeliveryPlanResult;
```

**Behavior (binding):**
- `monthsUntilDelivery`: count calendar months from the month AFTER the quote month through the delivery month inclusive, comparing plain `YYYY-MM` extracted from the ISO strings (callers pass Bogota-local dates — the lib is pure string math, no `Date` timezone pitfalls: `(eY-qY)*12 + (eM-qM)`). "2026-07-15" → "2028-06-01" = 23. Same month or past → 0 (never negative).
- `resolveEtapaPlan` fallback per field: torre value → `config.calc_defaults` → built-ins (pct 50, separación porcentaje 2.5). `fechaEntrega`: torre → `config.fecha_estimada_entrega` → null. `tipoEntrega` from `config.tipo_entrega` (default "fecha_fija"); `plazoMeses` from `config.plazo_entrega_meses ?? 24`. `fuente`: "etapa" if any torre param used, "incompleta" if tipoEntrega==="fecha_fija" && !fechaEntrega, else "proyecto".
- `buildDeliveryPlan`: `separacionPesos = tipo==="fijo" ? round(valor) : round(total*valor/100)`. N = plazo model ? plazoMeses : monthsUntilDelivery(quote, fecha). `contado = N<=0`. Fases:
  - normal: `[{id:"calc-separacion",nombre:"Separación",tipo:"fijo",valor:separacionPesos,cuotas:1,frecuencia:"unica"},{id:"calc-inicial",nombre:"Cuota inicial",tipo:"porcentaje",valor:pctInicial,cuotas:N,frecuencia:"mensual"},{id:"calc-financiacion",nombre:"Financiación",tipo:"resto",valor:0,cuotas:1,frecuencia:"unica"}]` (match `FaseConfig` exactly — read `src/types/index.ts:804-814` for required fields).
  - contado: same but inicial `cuotas:1, frecuencia:"unica"`.
- Guard: if `separacionPesos >= inicialPesos`, still build (engine handles), but expose it so UI can warn: add field `separacionExcedeInicial: boolean`.

**Test cases (write FIRST, RED, then implement):** the three reference cases asserting every number above; monthsUntilDelivery: ("2026-07-15","2028-06-01")→23, ("2026-07-31","2026-08-01")→1, same month→0, past→0, ("2026-12-10","2027-01-05")→1; plazo model N constant; contado case; fijo separación; fallbacks (torre null → proyecto defaults; nothing → built-ins; fecha missing → fuente "incompleta").

- [ ] RED → implement → GREEN (`npx vitest run src/lib/cotizador`) → tsc → commit `feat(cotizador): delivery-calc lib — meses hasta entrega + plan por etapa (TDD)`.

---

### Task 3: API — accept `precio_negociado` on persist + calculator metadata

**Files:**
- Modify: `src/app/api/cotizaciones/route.ts`

Read how `/api/cotizaciones/preview/route.ts` handles `precio_negociado` (~lines 45,166-168) and mirror it in the persisting POST: destructure `precio_negociado`, validate (positive number ≤ some sane bound, else ignore), apply the same way preview does before `calcularCotizacion`, and store it in the saved row if a column/field exists (check the insert payload — if no column exists, include it inside the existing metadata/config snapshot the row already stores; do NOT add a migration). Also accept optional `plan_origen: "calculadora" | "plantilla"` and persist it the same snapshot way (for analytics/debug).
- [ ] Verify with a focused vitest if the route has testable pure parts; otherwise gate = tsc + lint + code-trace in report. Commit `fix(cotizaciones): persistir precio_negociado (paridad con preview) + plan_origen`.

---

### Task 4: PDF — grouped inicial, extras band, vigencia, pre-line (TDD on build-html/build-data)

**Files:**
- Modify: `src/lib/cotizador/html/build-data.ts`, `build-html.ts`, `types.ts` (+ their `__tests__`)
- Modify: `src/lib/cotizador/html/from-db.ts` (read the new config extras)

- [ ] **Grouping:** when the fases correspond to the calculator shape (detect: a fase named exactly "Separación" tipo fijo followed by a "Cuota inicial" porcentaje fase — pass an explicit flag through instead of guessing: add optional `agrupar_inicial?: boolean` to the build input, set by the API when `plan_origen==="calculadora"`), render: header row "CUOTA INICIAL (50%)" with the summed amount (separación + cuotas fase), indented sub-rows for Separación and "N cuotas mensuales de $X", then Financiación row. Percentages still come from the existing Hamilton pass (inicial group shows the configured pct; sub-rows show their own).
- [ ] **Extras band:** render a compact info section (after the plan table) with any of: `Leasing: {leasing_nota}`, `Parqueadero(s): {parqueaderos_label}`, `Acabados: {acabados_nota}`, `Bonos y/o descuentos: {bonos_nota}` — only rows whose config value is non-empty.
- [ ] **Vigencia:** when `vigencia_dias` set, print above the legal notes: "Esta cotización tiene vigencia de {N} días calendario a partir de su expedición ({fecha})." with the quote date already available in the view.
- [ ] **Pre-line fix:** `.legal` CSS gains `white-space: pre-line;` so `notas_legales` keeps line breaks.
- [ ] TDD: extend the existing `__tests__` (build-data.test.ts patterns) — new cases assert the grouped HTML structure (header + sub-rows), extras rows presence/absence, vigencia line, and that reconcile tests still pass unchanged. RED→GREEN.
- [ ] Commit `feat(cotizador-pdf): agrupación de cuota inicial, extras (leasing/parqueaderos/acabados/bonos), vigencia y notas con saltos de línea`.

---

### Task 5: UI — DeliveryCalculator panel + mode toggle + templates warning

**Files:**
- Create: `src/components/dashboard/cotizador/DeliveryCalculator.tsx`
- Modify: `src/components/dashboard/cotizador/CotizadorTool.tsx` (mode toggle + integration)
- Modify: `src/components/dashboard/config-tabs/CotizadorTab.tsx` OR the cotizador-settings page (project defaults + extras fields) — find where `cotizador_config` is edited and add: calc_defaults (pct inicial, separación tipo+valor), leasing_nota, parqueaderos_label, acabados_nota, bonos_nota, vigencia_dias.

**DeliveryCalculator component (props contract):**
```ts
interface DeliveryCalculatorProps {
  totalPesos: number;                        // effective total incl. complementos (from CotizadorTool)
  torre: Torre | null;                       // resolved from selected unidad.torre_id
  config: CotizadorConfig | null | undefined;
  onFasesChange: (fases: FaseConfig[], meta: { planOrigen: "calculadora"; cuotas: number; contado: boolean }) => void;
  currency: string;
}
```
Renders: etapa/fecha summary ("Etapa 2 · entrega jun-2028 · 23 cuotas restantes"), the computed plan (separación / N cuotas × valor / financiación) using `buildDeliveryPlan` with `quoteDateISO` = today in America/Bogota (`new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bogota"}).format(new Date())` → YYYY-MM-DD), and two visible override inputs (% inicial, separación valor+tipo) defaulting to the resolved plan — edits recompute live and mark `negociado`. If `fuente==="incompleta"`: blocking notice "Esta etapa no tiene fecha de entrega configurada — defínela en Torres/Etapas" and no fases emitted. If `separacionExcedeInicial`: inline warning.

**CotizadorTool integration:** add a mode state `"calculadora" | "plantillas"`; default `"calculadora"` when the selected unit resolves a plan with `fuente !== "incompleta"`, else `"plantillas"`. Toggle UI near the existing payment-plan section (follow existing segmented-control patterns in the file). In calculadora mode: hide the paymentRows/plantilla builder, render DeliveryCalculator, and on generate/preview send its `fases` as `custom_fases` + `separacion_incluida: true` + `plan_origen: "calculadora"` (and DO NOT run any plantilla flattening). Torre data: the tool must have/fetch the unidad's torre (check what CotizadorTool already loads — `ProjectForCotizador`/unidades; if torres aren't loaded, fetch `/api/torres?proyecto_id=` the way other components do).
**Templates warning (adjustment #8):** where `adjustFasesToDelivery` output is used for plantilla mode preview, compare cuotas before/after; if changed, render a warning banner "⚠️ El plan excede la fecha de entrega: las cuotas fueron ajustadas de X a Y — revisa o usa la Calculadora de entrega." (Do not change the adjustment behavior.)

- [ ] Gate (tsc + lint 0 new) + commit `feat(cotizador): modo Calculadora de entrega (default) + settings de extras + aviso de ajuste en plantillas`.

---

### Task 6 (controller): review, deploy, migrate, configure, E2E

- [ ] Whole-branch review (opus) → fix wave if needed.
- [ ] CHECKPOINT Master → cherry-pick to main → deploy → apply migration to prod (additive) → purge data cache.
- [ ] Ops with Master: create Etapa 1/Etapa 2 in Índigo (Torres tab), he bulk-assigns casas in Inventario, set fechas + planes (E1: 30%, E2: 50%, sep 2.5%), verify tipología prices.
- [ ] Live E2E: create Índigo + Garden quotes through the real flow (agent session), verify numbers vs Excel and that `pdf_url` populates (closes the pending PDF e2e), screenshot PDF for Master.
