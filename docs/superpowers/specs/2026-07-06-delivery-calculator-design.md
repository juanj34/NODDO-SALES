# NodDo Quote — Calculadora de Entrega (design spec)

**Approved by Master 2026-07-06** ("dale implementala"), after adversarial completeness review (9 adjustments folded in).

## Problem

Developer quotes (BTO's Excel) are delivery-driven: the buyer pays a separación (deducted from the cuota inicial) and the REMAINDER of the inicial in N equal monthly cuotas, where **N = months remaining until the etapa's delivery date**. N shrinks every month, so the cuota grows. The current cotizador cannot express this: templates materialize fixed rows (unequal cuotas), the delivery config silently shrinks manually-chosen cuotas (`adjustFasesToDelivery` — the "double cuotas" confusion), and there are no per-etapa payment parameters.

Reference cases (must reproduce exactly):
- **Índigo Etapa 2**: $675,000,000 · inicial 50% · separación $16,875,000 (2.5%) · 23 cuotas × $13,940,217 · financiación 50%.
- **Garden**: $945,000,000 · inicial 50% · separación $23,625,000 · 26 cuotas × $17,264,423 · financiación 50%.
- **Índigo Etapa 1 "plan 3070"**: inicial 30% / financiación 70% (same separación mechanics).

## Decisions (Master)

1. Delivery date lives **per etapa/torre**; units inherit via `torre_id`. Fallback: torre.fecha_entrega → project `cotizador_config.fecha_estimada_entrega` → block with clear message (never invent).
2. Cuotas rule: **full calendar months** from the month AFTER the quote date through the delivery month, inclusive (jul-2026 → jun-2028 = 23). Dates evaluated in **America/Bogota**. If N ≤ 0 → inicial de contado (single payment).
3. Agent overrides: **auto + visible overrides** — % inicial and separación editable per quote (surfaced as negotiated); N is never hand-edited.
4. Calculator **coexists** as a new mode next to templates. It is the **default mode** when the resolved etapa/project has a delivery config; templates remain and their silent delivery-shrink becomes a **visible warning** instead.
5. **Per-etapa plan (adjustment #9)**: each etapa carries `% inicial` + `separación (% | monto fijo)` in addition to `fecha_entrega`. Project-level defaults; etapa overrides. Unit → etapa → plan resolution is automatic.

## The 9 folded adjustments

1. Both delivery models: `fecha_fija` (per-etapa date, N shrinks monthly) and `plazo_desde_compra` (N constant = `plazo_entrega_meses`).
2. Fallback chain for missing dates (above) with explicit blocking UI.
3. Calculator computes over the effective total including complementos (parqueaderos/depósitos sold separately).
4. Fix existing API bug: `POST /api/cotizaciones` must accept `precio_negociado` (preview accepts it; persist drops it).
5. Month counting in America/Bogota (UTC drift at month boundaries → off-by-one).
6. Separación configurable as **porcentaje o monto fijo** (BTO 2.5%; others use fixed amounts).
7. PDF groups "Cuota inicial (50%)" hierarchically (separación + N cuotas inside), then financiación — like the Excel.
8. Old-mode mitigation: `adjustFasesToDelivery` result surfaces a visible warning banner in templates mode when it modifies cuotas.
9. Per-etapa plan params (see Decisions 5).

Extras (Excel parity, config per project in `cotizador_config`): `leasing_nota` ("No" / free text), `parqueaderos_label` ("Privados"), `acabados_nota`, `bonos_nota`, `vigencia_dias` (prints "vigencia de X días calendario a partir de la expedición" + expedition date). Also fix `notas_legales` losing line breaks in the PDF (`white-space: pre-line`).

## Data model

- `torres` (migration, all nullable): `fecha_entrega date`, `plan_pct_inicial numeric`, `plan_separacion_tipo text check in ('porcentaje','fijo')`, `plan_separacion_valor numeric`.
- `CotizadorConfig` (jsonb, no migration): `calc_defaults?: { pct_inicial: number; separacion_tipo: "porcentaje" | "fijo"; separacion_valor: number }`, `leasing_nota?`, `parqueaderos_label?`, `acabados_nota?`, `bonos_nota?`, `vigencia_dias?: number`.

## Engine

New `src/lib/cotizador/delivery-calc.ts` (pure, tested):
- `monthsUntilDelivery(quoteDateISO, fechaEntregaISO): number` — Bogota-calendar rule above.
- `resolveEtapaPlan(unidad, torre, config)` — plan params with fallbacks.
- `buildDeliveryFases(params): FaseConfig[]` — `[ {tipo:"fijo", separación, cuotas:1}, {tipo:"porcentaje", valor:pctInicial, cuotas:N, frecuencia:"mensual"}, {tipo:"resto"} ]` with `separacion_incluida_en_inicial` semantics (engine already deducts fixed fase[0] from the porcentaje fase and computes equal cuotas via `FaseConfig.cuotas`).
- Calculator mode bypasses `adjustFasesToDelivery` (single source of truth).

## Out of scope

Post-sale plan tracking/collections; public microsite quick-quote; retiring templates; assigning Índigo's casas to etapas (Master does it via Inventario bulk-assign once the etapa fields ship).

## Verification

Unit tests with the three real cases (exact pesos); existing cotizador suites stay green; live E2E after deploy: configure etapas, create both quotes through the real flow, compare PDF vs Excel (also closes the pending cotización-PDF e2e check).
