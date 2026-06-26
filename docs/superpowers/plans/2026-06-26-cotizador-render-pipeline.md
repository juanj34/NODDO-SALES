# Cotizador App-Side Render Pipeline (HTML → Worker PDF → Private Bucket → Email)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Write the failing test FIRST, run it, see it fail, then write the REAL implementation, run it, see it pass, then commit.

**Goal:** Make the NODDO cotización PDF *work at all* and then make it premium. Replace the dead `@react-pdf` / jsPDF in-route renderer with: a pure HTML builder (`buildCotizacionData` + `buildCotizacionHtml`) that turns the existing `calcular.ts` pricing result + the project's `cotizador_config` into one self-contained premium HTML string; a generation service (`generate.ts`) that POSTs that HTML to the Railway Chromium worker (sibling plan `2026-06-26-cotizador-render-worker.md`), receives PDF bytes, stores them in a **private** Supabase bucket as an object *path*, mints short-lived signed URLs, and emails the buyer the PDF as an attachment via Resend. Rewire the four routes (`POST /api/cotizaciones`, `/preview`, `/[id]/regenerate`, `/[id]/resend`) to use it, give the agent success card a working "Descargar PDF", and verify the email actually fires. The payment-plan table must NEVER split across pages for any number of cuotas.

**Architecture:**
```
agent (dashboard) | buyer (microsite)  ──▶  /api/cotizaciones[...]
  └─▶ calcular.ts  (corrected pricing — see plan 2026-06-25-cotizador-correctness.md:
      precio_negociado honored, cargos summed into grand total, sum(phases)==plan total)
      └─▶ buildCotizacionData(input) → CotizacionView   (pure, no IO)
          └─▶ buildCotizacionHtml(view) → self-contained HTML  (pure, no IO,
              inline CSS, 4 brand fonts as base64 @font-face, images as data URIs / absolute URLs)
              └─▶ generate.ts: renderCotizacionPdf(html)
                  POST {COTIZADOR_RENDER_URL}/render  header x-render-token: {RENDER_SHARED_SECRET}
                    └─▶ Railway noddo-render: Chromium --print-to-pdf → PDF buffer
                        └─▶ upload to PRIVATE bucket `cotizaciones` at `{proyecto_id}/{cotizacion_id}.pdf`
                            └─▶ store the OBJECT PATH in cotizaciones.pdf_url (not a public URL)
                                ├─▶ email buyer (Resend, PDF buffer ATTACHED)
                                └─▶ dashboard/microsite: getCotizacionSignedUrl(path) on demand
```
The HTML builder + service are pure/testable against a **mocked worker** (no Railway needed to build/test). End-to-end requires the worker deployed and `COTIZADOR_RENDER_URL` set (see Dependencies).

**Tech Stack:** Next.js 16 route handlers (`runtime = "nodejs"`), React 19, TypeScript strict, Tailwind 4 (app UI only — the PDF HTML is hand-written inline CSS, NOT Tailwind), Supabase Postgres + **Storage (private bucket)**, Resend (email, no-ops without `RESEND_API_KEY`), Vitest 3 (already configured — `"test": "vitest run"`, `vitest.config.ts` node env, `@` alias, includes `src/**/*.{test,spec}.{ts,tsx}`). Pure pricing engine `@/lib/cotizador/calcular` and helpers (`payment-rows`, `delivery`, `plantilla-pago`, `quick-quote`). Real estate quote data shapes from `@/types` (`CotizadorConfig`, `ResultadoCotizacion`, `FaseResultado`, `PlantillaPago`, `CargoAdicional`, `ComplementoSeleccion`, `Currency`). Currency formatting `@/lib/currency` (`formatCurrency(amount, currency, options?)`). Service-role client `@/lib/supabase/admin` (`createAdminClient()`). The 4 brand TTFs already live at `src/lib/cotizador/fonts/{cormorant-light,syne-bold,inter-regular,dm-mono-regular}.ttf`.

---

## Branch & governance (read `WORKFLOW.md` first)

All work on a single feature branch off `dev` (NEVER `main` — `WORKFLOW.md` is explicit; `main` costs money and needs Juan's sign-off):

```bash
git checkout dev
git pull origin dev
git checkout -b feat/cotizador-render-pipeline
```

Verify gate **before every commit** (run from repo root `C:\dev\NODDO-SALES`):

```bash
npm run typecheck && npm run lint && npm test
```

Conventional commit prefixes only (`feat/fix/refactor/chore/test/docs`). Push to `origin feat/cotizador-render-pipeline`. Do NOT push `main`, do NOT merge to `main` — that is Juan's call after preview review.

> **Hard dependency on the pricing-correctness plan.** This plan **consumes** the corrected `calcular.ts` from `docs/superpowers/plans/2026-06-25-cotizador-correctness.md` (precio_negociado honored in the issuing POST; a canonical grand total that includes `cargos_adicionales`; `assertResultadoReconciles`; faithful regenerate from snapshot). Do NOT re-implement that math here. If that plan has not landed yet, Task 2 still adds an independent builder-level assertion, and the route rewiring (Task 5) is written to be compatible with both the pre- and post-correctness `resultado` shape (it never *recomputes* price — it consumes whatever `calcular.ts` returned). Land the correctness plan first when possible; otherwise these two plans are mergeable independently because they touch different files (correctness = pricing engine + route price-resolution; this plan = html/ builder + generate.ts + storage + route renderer-swap).

---

## Conventions used below

- **Grand total (what the buyer owes)** = `precio_total ?? precio_neto` **plus** `cargos_total ?? 0`. `calcular.ts` charges `cargos_aplicados` (IVA/admin/DLD) ON TOP of the plan total; the payment *phases* sum to `precio_total ?? precio_neto` (the "plan total"), and cargos are billed separately. The cover/summary headline shows the grand-total-with-cargos; the table TOTAL row shows the plan total; cargos are itemized below it. (Colombia construction usually has no IVA → `cargos` empty → grand total == plan total. Where a cargo is configured, it is added.) This mirrors `effectivePlanTotal` from the correctness plan: phases reconcile to the plan total, cargos are additive.
- **Currency:** primary `view.moneda`; optional secondary `view.monedaSecundaria` + `view.tipoCambio` for dual display (`≈ formatCurrency(Math.round(x * tipoCambio), secCur)`).
- **No Tailwind in the PDF HTML.** The worker renders raw HTML in Chromium with zero build step. All styling is a single inlined `<style>` block. Tailwind classes would not exist there.

---

### Task 1: HTML builder — `buildCotizacionData` + `buildCotizacionHtml` (the new render core)

Build the pure, IO-free render core: a normalizer (`buildCotizacionData`) that folds the unidad snapshot + selected `plantilla_pago` + `cargos_adicionales` + branding + agent + the `calcular.ts` `ResultadoCotizacion` into a flat `CotizacionView`, and a serializer (`buildCotizacionHtml`) that turns that view into one self-contained premium HTML string. This is a SOLID BASE template (the premium per-project visual polish is a separate follow-on — note it, don't block on it). The critical, non-negotiable requirements: the payment-plan table uses `page-break-inside: avoid` on rows and a repeating `<thead>` (`display: table-header-group`) so it NEVER splits a row across pages and the header repeats on each overflow page for any number of cuotas; the price summary shows the CORRECT grand total (plan total + cargos); `precio_negociado` is honored (the view consumes whatever `calcular.ts` already priced — it never re-prices); no overlays; no excess whitespace.

**Files:**
- Create: `src/lib/cotizador/html/types.ts` (the `CotizacionView` + `BuildCotizacionDataInput` shapes)
- Create: `src/lib/cotizador/html/build-data.ts` (`buildCotizacionData`)
- Create: `src/lib/cotizador/html/build-html.ts` (`buildCotizacionHtml`)
- Create: `src/lib/cotizador/html/fonts-base64.ts` (reads the 4 brand TTFs → base64 `@font-face` CSS, cached)
- Create: `src/lib/cotizador/html/__tests__/build-data.test.ts`
- Create: `src/lib/cotizador/html/__tests__/build-html.test.ts`

- [ ] **Step 1 — Write the failing test first for `buildCotizacionData`** at `src/lib/cotizador/html/__tests__/build-data.test.ts`. It imports not-yet-existing modules and pins the normalization contract. Use the REAL `calcularCotizacion` to produce the `resultado` so the test exercises the real engine:

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";

const config: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: "Cotización indicativa. Valores sujetos a confirmación.",
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 6, frecuencia: "mensual" },
    { id: "f3", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

function baseInput(overrides: Partial<BuildCotizacionDataInput> = {}): BuildCotizacionDataInput {
  const resultado = calcularCotizacion(300_000_000, config);
  return {
    resultado,
    config,
    moneda: "COP",
    proyecto: {
      nombre: "Hito 18",
      constructoraNombre: "Constructora Demo",
      colorPrimario: "#b8973a",
      ubicacionDireccion: "Calle 18 #45-10, Medellín",
      estadoConstruccion: "sobre_planos",
      logoUrl: "https://cdn.noddo.io/p/logo.png",
      constructoraLogoUrl: null,
      coverUrl: "https://cdn.noddo.io/p/render-cover.jpg",
      renders: ["https://cdn.noddo.io/p/render-1.jpg", "https://cdn.noddo.io/p/render-2.jpg"],
      planoUrl: "https://cdn.noddo.io/p/plano-a.jpg",
      whatsappNumero: "+573001112233",
      tour360Url: null,
    },
    unidad: {
      identificador: "Apto 1203",
      tipologiaName: "Tipología A",
      areaConstruida: 78,
      areaPrivada: 70,
      areaLote: null,
      areaM2: 78,
      unidadMedida: "m²",
      piso: 12,
      vista: "Ciudad",
      habitaciones: 3,
      banos: 2,
      orientacion: "Nororiente",
      parqueaderos: 1,
      depositos: 1,
      features: { tiene_terraza: true, tiene_jacuzzi: false },
    },
    agente: { nombre: "Ana Pérez", telefono: "+573009998877", email: "ana@constructora.com", avatarUrl: null },
    buyer: { nombre: "Juan Comprador", email: "juan@cliente.com", telefono: "+573004445566" },
    complementos: [],
    fechaDisplay: "26 de junio de 2026",
    fechaEstimadaEntrega: "Diciembre 2028",
    referenceNumber: "COT-2026-AB12",
    paymentPlanNombre: "Plan 30/30/40",
    notasLegales: config.notas_legales,
    idioma: "es",
    monedaSecundaria: null,
    tipoCambio: null,
    ...overrides,
  };
}

describe("buildCotizacionData", () => {
  it("normalizes a quote into a flat CotizacionView", () => {
    const view = buildCotizacionData(baseInput());
    expect(view.proyectoNombre).toBe("Hito 18");
    expect(view.unidadId).toBe("Apto 1203");
    expect(view.tipologiaName).toBe("Tipología A");
    expect(view.referenceNumber).toBe("COT-2026-AB12");
    expect(view.fases.length).toBe(3);
    // The 6-cuota phase keeps its cuotas count + per-cuota amount for the table
    expect(view.fases[1].cuotas).toBe(6);
    expect(view.fases[1].montoPorCuota).toBeGreaterThan(0);
  });

  it("grand total = plan total + cargos and equals the phase sum + cargos", () => {
    // Add a 2% cargo to prove it is summed into the grand total but NOT into the phases
    const cfgWithCargo: CotizadorConfig = {
      ...config,
      cargos_adicionales: [{ id: "iva", nombre: "IVA", tipo: "porcentaje", valor: 2 }],
    };
    const resultado = calcularCotizacion(300_000_000, cfgWithCargo);
    const view = buildCotizacionData(baseInput({ resultado, config: cfgWithCargo }));

    const planTotal = resultado.precio_total ?? resultado.precio_neto; // phases sum to this
    const cargosTotal = resultado.cargos_total ?? 0;
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);

    expect(cargosTotal).toBeGreaterThan(0);
    expect(phaseSum).toBe(planTotal);                      // phases reconcile to the plan total
    expect(view.planTotal).toBe(planTotal);
    expect(view.cargosTotal).toBe(cargosTotal);
    expect(view.grandTotal).toBe(planTotal + cargosTotal); // grand total includes cargos
  });

  it("honors precio_negociado (consumes the already-priced resultado, never re-prices)", () => {
    // Caller negotiated 270M; calcular.ts was called with 270M (per correctness plan)
    const negotiated = calcularCotizacion(270_000_000, config);
    const view = buildCotizacionData(baseInput({ resultado: negotiated }));
    expect(view.precioBase).toBe(270_000_000);
    expect(view.planTotal).toBe(270_000_000);
  });
});
```

- [ ] **Step 2 — Run it (expect FAIL).**

```bash
npm test src/lib/cotizador/html/__tests__/build-data.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/cotizador/html/build-data'` / `does not provide an export named 'buildCotizacionData'`.

- [ ] **Step 3 — Create `src/lib/cotizador/html/types.ts`** (the view + input contract). These are the REAL shapes the builder and routes will use:

```ts
import type {
  CotizadorConfig,
  ResultadoCotizacion,
  ComplementoSeleccion,
  Currency,
} from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

/** A single payment phase, already formatted-ready (numbers + raw strings). */
export interface ViewFase {
  nombre: string;
  montoTotal: number;
  cuotas: number;
  montoPorCuota: number;
  frecuencia: string;
  fecha: string | null;
  porcentaje: number;
  condicionHito: string | null;
}

export interface ViewCargo {
  nombre: string;
  monto: number;
  tipo: "porcentaje" | "fijo";
  porcentaje: number | null;
}

export interface ViewDescuento {
  nombre: string;
  monto: number;
}

export interface ViewComplemento {
  label: string;
  precio: number | null;
  incluido: boolean;
}

/** Flat, render-ready normalization of a quote. No IO, no async, no DB shapes. */
export interface CotizacionView {
  // Branding
  proyectoNombre: string;
  constructoraNombre: string | null;
  colorPrimario: string;
  logoUrl: string | null;
  constructoraLogoUrl: string | null;
  coverUrl: string | null;
  renders: string[];
  planoUrl: string | null;
  ubicacionDireccion: string | null;
  estadoConstruccion: "sobre_planos" | "en_construccion" | "entregado";
  whatsappNumero: string | null;
  tour360Url: string | null;

  // Unit
  unidadId: string;
  tipologiaName: string | null;
  areaConstruida: number | null;
  areaPrivada: number | null;
  areaLote: number | null;
  areaM2: number | null;
  unidadMedida: string;
  piso: number | null;
  vista: string | null;
  habitaciones: number | null;
  banos: number | null;
  orientacion: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  /** boolean amenity flags, e.g. { tiene_terraza: true } — rendered as "Sí" rows */
  features: Record<string, boolean>;

  // Pricing
  moneda: Currency;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
  precioBase: number;
  descuentos: ViewDescuento[];
  /** Plan total the payment phases sum to (precio_total ?? precio_neto). */
  planTotal: number;
  cargos: ViewCargo[];
  cargosTotal: number;
  /** What the buyer owes: planTotal + cargosTotal. */
  grandTotal: number;
  complementos: ViewComplemento[];
  complementosTotal: number;
  fases: ViewFase[];
  paymentPlanNombre: string;

  // Parties
  agenteNombre: string | null;
  agenteTelefono: string | null;
  agenteEmail: string | null;
  buyerNombre: string;
  buyerEmail: string;
  buyerTelefono: string | null;

  // Meta
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  notasLegales: string | null;
  idioma: EmailLocale;
}

/** Raw, already-fetched inputs the route hands to the builder. */
export interface BuildCotizacionDataInput {
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  moneda: Currency;
  proyecto: {
    nombre: string;
    constructoraNombre: string | null;
    colorPrimario: string | null;
    ubicacionDireccion: string | null;
    estadoConstruccion: "sobre_planos" | "en_construccion" | "entregado" | null;
    logoUrl: string | null;
    constructoraLogoUrl: string | null;
    coverUrl: string | null;
    renders: string[];
    planoUrl: string | null;
    whatsappNumero: string | null;
    tour360Url: string | null;
  };
  unidad: {
    identificador: string;
    tipologiaName: string | null;
    areaConstruida: number | null;
    areaPrivada: number | null;
    areaLote: number | null;
    areaM2: number | null;
    unidadMedida: string;
    piso: number | null;
    vista: string | null;
    habitaciones: number | null;
    banos: number | null;
    orientacion: string | null;
    parqueaderos: number | null;
    depositos: number | null;
    features: Record<string, boolean>;
  };
  agente: { nombre: string | null; telefono: string | null; email: string | null; avatarUrl: string | null };
  buyer: { nombre: string; email: string; telefono: string | null };
  complementos: ComplementoSeleccion[];
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  paymentPlanNombre: string;
  notasLegales: string | null;
  idioma: EmailLocale;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
}
```

- [ ] **Step 4 — Create `src/lib/cotizador/html/build-data.ts`** (the REAL normalizer). It consumes the already-priced `resultado` — it NEVER calls `calcularCotizacion`:

```ts
import type {
  CotizacionView,
  BuildCotizacionDataInput,
  ViewFase,
  ViewCargo,
  ViewComplemento,
} from "./types";
import type { ComplementoSeleccion } from "@/types";

const DEFAULT_PRIMARY = "#b8973a";

function complementoLabel(c: ComplementoSeleccion): string {
  const tipo =
    c.tipo === "parqueadero" ? "Parqueadero" : c.tipo === "deposito" ? "Depósito" : "Adicional";
  let s = `${tipo}: ${c.identificador}`;
  if (c.subtipo) s += ` (${c.subtipo})`;
  if (c.cantidad && c.cantidad > 1) s += ` ×${c.cantidad}`;
  if (c.es_extra) s += " — adicional";
  return s;
}

function complementoPrecio(c: ComplementoSeleccion): number | null {
  const p = c.precio_negociado ?? c.precio;
  if (p == null) return null;
  return p * (c.cantidad ?? 1);
}

/**
 * Fold an already-priced quote into a flat, render-ready CotizacionView.
 * Pure: no IO, no async, no re-pricing. The phases come straight from
 * resultado.fases (which calcular.ts already computed on the negotiated price).
 */
export function buildCotizacionData(input: BuildCotizacionDataInput): CotizacionView {
  const { resultado, proyecto, unidad, agente, buyer } = input;

  // Plan total = what the phases sum to (precio_total when complementos exist, else precio_neto).
  const planTotal = resultado.precio_total ?? resultado.precio_neto;
  const cargosTotal = resultado.cargos_total ?? 0;
  const grandTotal = planTotal + cargosTotal;

  const fases: ViewFase[] = resultado.fases.map((f) => ({
    nombre: f.nombre,
    montoTotal: f.monto_total,
    cuotas: f.cuotas,
    montoPorCuota: f.monto_por_cuota,
    frecuencia: f.frecuencia,
    fecha: f.fecha ?? null,
    porcentaje:
      f.porcentaje ?? (planTotal > 0 ? Math.round((f.monto_total / planTotal) * 100) : 0),
    condicionHito: f.condicion_hito ?? null,
  }));

  const cargos: ViewCargo[] = (resultado.cargos_aplicados ?? []).map((c) => ({
    nombre: c.nombre,
    monto: c.monto,
    tipo: c.tipo,
    porcentaje: c.porcentaje ?? null,
  }));

  const descuentos = resultado.descuentos_aplicados.map((d) => ({
    nombre: d.nombre,
    monto: d.monto,
  }));

  const complementos: ViewComplemento[] = input.complementos.map((c) => {
    const precio = complementoPrecio(c);
    return {
      label: complementoLabel(c),
      precio,
      incluido: (precio == null || precio === 0) && !c.suma_al_total,
    };
  });
  const complementosTotal = resultado.complementos_total ?? 0;

  return {
    proyectoNombre: proyecto.nombre,
    constructoraNombre: proyecto.constructoraNombre,
    colorPrimario: proyecto.colorPrimario || DEFAULT_PRIMARY,
    logoUrl: proyecto.logoUrl,
    constructoraLogoUrl: proyecto.constructoraLogoUrl,
    coverUrl: proyecto.coverUrl,
    renders: proyecto.renders ?? [],
    planoUrl: proyecto.planoUrl,
    ubicacionDireccion: proyecto.ubicacionDireccion,
    estadoConstruccion: proyecto.estadoConstruccion ?? "sobre_planos",
    whatsappNumero: proyecto.whatsappNumero,
    tour360Url: proyecto.tour360Url,

    unidadId: unidad.identificador,
    tipologiaName: unidad.tipologiaName,
    areaConstruida: unidad.areaConstruida,
    areaPrivada: unidad.areaPrivada,
    areaLote: unidad.areaLote,
    areaM2: unidad.areaM2,
    unidadMedida: unidad.unidadMedida,
    piso: unidad.piso,
    vista: unidad.vista,
    habitaciones: unidad.habitaciones,
    banos: unidad.banos,
    orientacion: unidad.orientacion,
    parqueaderos: unidad.parqueaderos,
    depositos: unidad.depositos,
    features: unidad.features ?? {},

    moneda: input.moneda,
    monedaSecundaria: input.monedaSecundaria,
    tipoCambio: input.tipoCambio,
    precioBase: resultado.precio_base,
    descuentos,
    planTotal,
    cargos,
    cargosTotal,
    grandTotal,
    complementos,
    complementosTotal,
    fases,
    paymentPlanNombre: input.paymentPlanNombre,

    agenteNombre: agente.nombre,
    agenteTelefono: agente.telefono,
    agenteEmail: agente.email,
    buyerNombre: buyer.nombre,
    buyerEmail: buyer.email,
    buyerTelefono: buyer.telefono,

    fechaDisplay: input.fechaDisplay,
    fechaEstimadaEntrega: input.fechaEstimadaEntrega,
    referenceNumber: input.referenceNumber,
    notasLegales: input.notasLegales,
    idioma: input.idioma,
  };
}
```

- [ ] **Step 5 — Run the build-data test (expect PASS).**

```bash
npm test src/lib/cotizador/html/__tests__/build-data.test.ts
```

Expected: `3 passed (3)`.

- [ ] **Step 6 — Create `src/lib/cotizador/html/fonts-base64.ts`** (embed the 4 brand TTFs as base64 `@font-face`, cached at module scope). Uses the SAME `__dirname`-relative + `process.cwd()` fallback strategy as the existing `pdf-react/fonts.ts`:

```ts
import * as fs from "fs";
import * as path from "path";

const FONT_FILES = [
  { file: "cormorant-light.ttf", family: "Cormorant", weight: 300 },
  { file: "syne-bold.ttf", family: "Syne", weight: 700 },
  { file: "inter-regular.ttf", family: "Inter", weight: 400 },
  { file: "dm-mono-regular.ttf", family: "DM Mono", weight: 400 },
] as const;

let cachedCss: string | null = null;

function resolveFontsDir(): string {
  // The fonts live at src/lib/cotizador/fonts/ — a sibling of the html/ dir's parent.
  const primary = path.join(__dirname, "..", "fonts");
  const alt = path.join(process.cwd(), "src", "lib", "cotizador", "fonts");
  return fs.existsSync(primary) ? primary : alt;
}

/**
 * Returns a <style>-ready CSS string with all 4 brand fonts inlined as
 * base64 data-URI @font-face rules. Cached after first read.
 * No external/relative font refs survive — the worker renders from a temp file.
 */
export function brandFontFaceCss(): string {
  if (cachedCss !== null) return cachedCss;
  const dir = resolveFontsDir();
  const rules: string[] = [];
  for (const { file, family, weight } of FONT_FILES) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) {
      console.warn(`[cotizador/html] brand font not found: ${fp}`);
      continue;
    }
    const b64 = fs.readFileSync(fp).toString("base64");
    rules.push(
      `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;` +
        `font-display:swap;src:url(data:font/ttf;base64,${b64}) format('truetype');}`,
    );
  }
  cachedCss = rules.join("\n");
  return cachedCss;
}
```

- [ ] **Step 7 — Write the failing test first for `buildCotizacionHtml`** at `src/lib/cotizador/html/__tests__/build-html.test.ts`. This is the golden-HTML / assertion test. It asserts the load-bearing invariants (page-break rules, grand total, precio_negociado, no external asset refs):

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import { buildCotizacionHtml } from "@/lib/cotizador/html/build-html";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";
import { formatCurrency } from "@/lib/currency";

const config: CotizadorConfig = {
  moneda: "COP",
  separacion_incluida_en_inicial: false,
  descuentos: [],
  notas_legales: "Cotización indicativa. Valores sujetos a confirmación.",
  cargos_adicionales: [{ id: "admin", nombre: "Gastos de escrituración", tipo: "fijo", valor: 5_000_000 }],
  fases: [
    { id: "f1", nombre: "Cuota inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Cuotas", tipo: "porcentaje", valor: 30, cuotas: 18, frecuencia: "mensual" },
    { id: "f3", nombre: "Saldo a la entrega", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

function makeView(price = 300_000_000) {
  const resultado = calcularCotizacion(price, config);
  const input: BuildCotizacionDataInput = {
    resultado,
    config,
    moneda: "COP",
    proyecto: {
      nombre: "Hito 18", constructoraNombre: "Constructora Demo", colorPrimario: "#b8973a",
      ubicacionDireccion: "Calle 18 #45-10", estadoConstruccion: "sobre_planos",
      logoUrl: "https://cdn.noddo.io/p/logo.png", constructoraLogoUrl: null,
      coverUrl: "https://cdn.noddo.io/p/cover.jpg",
      renders: ["https://cdn.noddo.io/p/r1.jpg"], planoUrl: "https://cdn.noddo.io/p/plano.jpg",
      whatsappNumero: "+573001112233", tour360Url: null,
    },
    unidad: {
      identificador: "Apto 1203", tipologiaName: "Tipología A", areaConstruida: 78, areaPrivada: 70,
      areaLote: null, areaM2: 78, unidadMedida: "m²", piso: 12, vista: "Ciudad",
      habitaciones: 3, banos: 2, orientacion: "Nororiente", parqueaderos: 1, depositos: 1,
      features: { tiene_terraza: true },
    },
    agente: { nombre: "Ana Pérez", telefono: "+573009998877", email: "ana@x.com", avatarUrl: null },
    buyer: { nombre: "Juan Comprador", email: "juan@cliente.com", telefono: "+573004445566" },
    complementos: [],
    fechaDisplay: "26 de junio de 2026", fechaEstimadaEntrega: "Diciembre 2028",
    referenceNumber: "COT-2026-AB12", paymentPlanNombre: "Plan 30/30/40",
    notasLegales: config.notas_legales, idioma: "es", monedaSecundaria: null, tipoCambio: null,
  };
  return { view: buildCotizacionData(input), resultado };
}

describe("buildCotizacionHtml", () => {
  it("emits a self-contained HTML document with inlined brand fonts", () => {
    const { view } = makeView();
    const html = buildCotizacionHtml(view);
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("@font-face");
    expect(html).toContain("data:font/ttf;base64,");
    // No external stylesheet/script refs
    expect(html).not.toContain("<link rel=\"stylesheet\"");
    expect(html).not.toContain("<script");
  });

  it("makes the payment table page-break safe for any number of cuotas", () => {
    const { view } = makeView();
    expect(view.fases[1].cuotas).toBe(18); // long plan
    const html = buildCotizacionHtml(view);
    // Rows never split mid-row; header repeats on each page
    expect(html).toContain("page-break-inside:avoid");
    expect(html).toContain("display:table-header-group");
    // One <tr> per phase row is present
    const rowCount = (html.match(/data-fase-row/g) || []).length;
    expect(rowCount).toBe(view.fases.length);
  });

  it("shows the grand total = plan total + cargos", () => {
    const { view, resultado } = makeView();
    const planTotal = resultado.precio_total ?? resultado.precio_neto;
    const cargosTotal = resultado.cargos_total ?? 0;
    expect(cargosTotal).toBe(5_000_000);
    const html = buildCotizacionHtml(view);
    expect(html).toContain(formatCurrency(planTotal + cargosTotal, "COP")); // grand total rendered
    expect(html).toContain("Gastos de escrituración"); // cargo itemized
  });

  it("honors precio_negociado (renders the negotiated price, not a list price)", () => {
    const { view } = makeView(270_000_000);
    expect(view.precioBase).toBe(270_000_000);
    const html = buildCotizacionHtml(view);
    expect(html).toContain(formatCurrency(270_000_000, "COP"));
  });

  it("escapes user-controlled text (no raw injection)", () => {
    const { view } = makeView();
    view.buyerNombre = "<script>alert(1)</script>";
    const html = buildCotizacionHtml(view);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
```

- [ ] **Step 8 — Run it (expect FAIL).**

```bash
npm test src/lib/cotizador/html/__tests__/build-html.test.ts
```

Expected: FAIL — `does not provide an export named 'buildCotizacionHtml'`.

- [ ] **Step 9 — Create `src/lib/cotizador/html/build-html.ts`** (the REAL serializer — solid base template). Self-contained: inline `<style>`, base64 fonts, images as absolute URLs (the worker fetches them) or data URIs. The payment table is a real `<table>` with `<thead>` repeat + per-row `page-break-inside:avoid`. NODDO design language (forest/champagne, the 4 fonts). No overlays. No excess whitespace:

```ts
import type { CotizacionView, ViewFase } from "./types";
import { brandFontFaceCss } from "./fonts-base64";
import { formatCurrency } from "@/lib/currency";

function esc(s: string | null | undefined): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function money(v: number, view: CotizacionView): string {
  let s = esc(formatCurrency(v, view.moneda));
  if (view.monedaSecundaria && view.tipoCambio) {
    s += ` <span class="sec">≈ ${esc(
      formatCurrency(Math.round(v * view.tipoCambio), view.monedaSecundaria),
    )}</span>`;
  }
  return s;
}

const FREQ_ES: Record<string, string> = {
  unica: "Pago único", mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral",
};
const FREQ_EN: Record<string, string> = {
  unica: "One-time", mensual: "Monthly", bimestral: "Bimonthly", trimestral: "Quarterly",
};
const STATUS_ES: Record<string, string> = {
  sobre_planos: "Sobre planos", en_construccion: "En construcción", entregado: "Entregado",
};
const STATUS_EN: Record<string, string> = {
  sobre_planos: "Off-plan", en_construccion: "Under construction", entregado: "Completed",
};

function detailRows(pairs: [string, string][]): string {
  return pairs
    .map(
      ([k, v]) =>
        `<div class="drow"><span class="dk">${esc(k)}</span><span class="dv">${esc(v)}</span></div>`,
    )
    .join("");
}

function faseRow(f: ViewFase, view: CotizacionView): string {
  const freq = view.idioma === "en" ? FREQ_EN : FREQ_ES;
  const sub =
    f.cuotas > 1
      ? `<div class="cuota-sub">${f.cuotas} × ${freq[f.frecuencia] || f.frecuencia} · ${esc(
          formatCurrency(f.montoPorCuota, view.moneda),
        )}</div>`
      : "";
  const fecha = f.fecha ? esc(f.fecha) : f.condicionHito ? "" : "—";
  const cond = f.condicionHito ? `<div class="cond">${esc(f.condicionHito)}</div>` : "";
  return (
    `<tr data-fase-row class="prow">` +
    `<td class="c-name">${esc(f.nombre)}${sub}</td>` +
    `<td class="c-pct">${f.porcentaje}%</td>` +
    `<td class="c-date">${fecha}${cond}</td>` +
    `<td class="c-amt">${money(f.montoTotal, view)}</td>` +
    `</tr>`
  );
}

/**
 * Serialize a CotizacionView into ONE self-contained premium HTML string.
 * SOLID BASE template — premium per-project polish is a separate follow-on
 * (see Open items). Critical: payment table never splits a row across pages
 * and its header repeats (page-break-inside:avoid + display:table-header-group).
 */
export function buildCotizacionHtml(view: CotizacionView): string {
  const en = view.idioma === "en";
  const t = {
    quotation: en ? "QUOTATION" : "COTIZACIÓN",
    salesOffer: en ? "SALES OFFER" : "OFERTA DE VENTA",
    projectDetails: en ? "PROJECT DETAILS" : "DETALLES DEL PROYECTO",
    propertyDetails: en ? "PROPERTY DETAILS" : "DETALLES DE LA PROPIEDAD",
    paymentPlan: view.paymentPlanNombre || (en ? "PAYMENT PLAN" : "PLAN DE PAGOS"),
    description: en ? "Description" : "Descripción",
    date: en ? "Date" : "Fecha",
    amount: en ? "Amount" : "Monto",
    total: en ? "TOTAL" : "TOTAL",
    grandTotal: en ? "TOTAL TO PAY" : "TOTAL A PAGAR",
    renders: en ? "PROJECT RENDERS" : "RENDERS DEL PROYECTO",
    floorPlan: en ? "FLOOR PLAN" : "PLANO DE PLANTA",
    advisor: en ? "ADVISOR" : "ASESOR",
    preparedFor: en ? "PREPARED FOR" : "PREPARADA PARA",
    legal: en ? "LEGAL NOTICE" : "AVISO LEGAL",
    estimatedDelivery: en ? "Estimated delivery" : "Entrega estimada",
    status: en ? "Status" : "Estado",
    location: en ? "Location" : "Ubicación",
    unit: en ? "Unit" : "Unidad",
    typology: en ? "Typology" : "Tipología",
    generatedBy: en ? "Generated by NODDO — noddo.io" : "Generado por NODDO — noddo.io",
  };

  const accent = esc(view.colorPrimario);
  const u = esc(view.unidadMedida);

  // Project details
  const projPairs: [string, string][] = [
    [t.location, view.ubicacionDireccion ?? "—"],
    [t.status, (en ? STATUS_EN : STATUS_ES)[view.estadoConstruccion]],
  ];
  if (view.fechaEstimadaEntrega) projPairs.push([t.estimatedDelivery, view.fechaEstimadaEntrega]);

  // Property details
  const propPairs: [string, string][] = [[t.unit, view.unidadId]];
  if (view.tipologiaName) propPairs.unshift([t.typology, view.tipologiaName]);
  if (view.areaConstruida) propPairs.push([en ? "Built area" : "Área construida", `${view.areaConstruida} ${u}`]);
  if (view.areaPrivada) propPairs.push([en ? "Private area" : "Área privada", `${view.areaPrivada} ${u}`]);
  if (view.areaLote) propPairs.push([en ? "Lot area" : "Área lote", `${view.areaLote} ${u}`]);
  if (view.habitaciones) propPairs.push([en ? "Bedrooms" : "Habitaciones", String(view.habitaciones)]);
  if (view.banos) propPairs.push([en ? "Bathrooms" : "Baños", String(view.banos)]);
  if (view.piso != null) propPairs.push([en ? "Floor" : "Piso", String(view.piso)]);
  if (view.vista) propPairs.push([en ? "View" : "Vista", view.vista]);
  if (view.orientacion) propPairs.push([en ? "Orientation" : "Orientación", view.orientacion]);
  if (view.parqueaderos) propPairs.push([en ? "Parking" : "Parqueaderos", String(view.parqueaderos)]);
  if (view.depositos) propPairs.push([en ? "Storage" : "Depósitos", String(view.depositos)]);

  const cargosHtml = view.cargos
    .map(
      (c) =>
        `<tr class="extra"><td colspan="3" class="c-name">${esc(c.nombre)}${
          c.tipo === "porcentaje" && c.porcentaje != null ? ` (${c.porcentaje}%)` : ""
        }</td><td class="c-amt">${money(c.monto, view)}</td></tr>`,
    )
    .join("");

  const descHtml = view.descuentos
    .map(
      (d) =>
        `<tr class="discount"><td colspan="3" class="c-name">− ${esc(d.nombre)}</td>` +
        `<td class="c-amt">−${esc(formatCurrency(d.monto, view.moneda))}</td></tr>`,
    )
    .join("");

  const rendersHtml =
    view.renders.length > 0
      ? `<section class="page renders"><div class="label">${t.renders}</div>` +
        view.renders
          .slice(0, 4)
          .map((r) => `<img class="render" src="${esc(r)}" alt="" />`)
          .join("") +
        `</section>`
      : "";

  const planoHtml = view.planoUrl
    ? `<section class="page plano"><div class="label">${t.floorPlan}</div>` +
      `<div class="plano-head">${esc(view.tipologiaName ?? "")} · ${t.unit}: ${esc(view.unidadId)}</div>` +
      `<img class="plano-img" src="${esc(view.planoUrl)}" alt="" /></section>`
    : "";

  const coverImg = view.coverUrl
    ? `<img class="cover-img" src="${esc(view.coverUrl)}" alt="" />`
    : "";

  const agentCard = view.agenteNombre
    ? `<div class="agent"><div class="label">${t.advisor}</div>` +
      `<div class="agent-name">${esc(view.agenteNombre)}</div>` +
      (view.agenteTelefono ? `<div class="agent-line">${esc(view.agenteTelefono)}</div>` : "") +
      (view.agenteEmail ? `<div class="agent-line">${esc(view.agenteEmail)}</div>` : "") +
      `</div>`
    : "";

  const fonts = brandFontFaceCss();

  return `<!DOCTYPE html>
<html lang="${view.idioma}">
<head>
<meta charset="utf-8" />
<style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box;}
@page{size:Letter;margin:14mm 12mm;}
html,body{font-family:'Inter',system-ui,sans-serif;color:#1b1b1b;font-size:10px;line-height:1.45;}
.sec{color:#8a8580;font-size:0.78em;}
h1,.title{font-family:'Cormorant',serif;font-weight:300;}
.label{font-family:'Syne',sans-serif;font-weight:700;font-size:8px;letter-spacing:1.4px;text-transform:uppercase;color:${accent};margin:0 0 6px;}
.mono{font-family:'DM Mono',monospace;}
.cover{position:relative;height:240mm;display:flex;flex-direction:column;justify-content:flex-end;page-break-after:always;background:#0e1512;color:#f4f0e8;overflow:hidden;}
.cover-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0.55;}
.cover-inner{position:relative;padding:22mm 14mm;}
.cover .brand{font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:2px;color:${accent};text-transform:uppercase;}
.cover h1{font-size:40px;margin:8px 0;}
.cover .rule{width:90px;height:2px;background:${accent};margin:6px 0 10px;}
.cover .meta{display:flex;justify-content:space-between;font-family:'DM Mono',monospace;font-size:8px;color:#cfc9bd;margin-top:10px;}
.section{margin:0 0 12px;}
.summary{border:1px solid #e6e2da;border-radius:6px;padding:12px 14px;margin:0 0 12px;background:#fbfaf7;}
.summary .grand{display:flex;justify-content:space-between;align-items:baseline;}
.summary .grand .lbl{font-family:'Syne',sans-serif;font-weight:700;font-size:9px;letter-spacing:1px;text-transform:uppercase;}
.summary .grand .val{font-family:'DM Mono',monospace;font-size:16px;color:${accent};}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 18px;border:1px solid #e6e2da;border-radius:6px;padding:8px 12px;background:#fbfaf7;}
.drow{display:flex;justify-content:space-between;padding:3px 0;border-bottom:0.5px solid #efece6;font-size:9px;}
.drow:last-child{border-bottom:none;}
.dk{color:#8a8580;}
.dv{font-family:'DM Mono',monospace;color:#1b1b1b;text-align:right;}
table.plan{width:100%;border-collapse:collapse;margin-top:4px;}
table.plan thead{display:table-header-group;}
table.plan th{font-family:'Syne',sans-serif;font-weight:700;font-size:7.5px;letter-spacing:0.6px;text-transform:uppercase;color:#fff;background:${accent};text-align:left;padding:6px 8px;}
table.plan th.c-pct,table.plan th.c-amt{text-align:right;}
table.plan tr{page-break-inside:avoid;}
table.plan td{padding:6px 8px;border-bottom:0.5px solid #ece8e1;vertical-align:top;font-size:9px;}
.prow:nth-child(even) td{background:#faf8f4;}
.c-pct{color:${accent};font-family:'DM Mono',monospace;text-align:right;white-space:nowrap;}
.c-date{font-family:'DM Mono',monospace;color:#6b6b6b;white-space:nowrap;}
.c-amt{font-family:'DM Mono',monospace;text-align:right;white-space:nowrap;}
.cuota-sub{font-family:'DM Mono',monospace;font-size:7px;color:#9a958c;margin-top:2px;}
.cond{font-size:7px;color:${accent};margin-top:2px;}
tr.discount td{color:#2e8b57;}
tr.extra td{color:#444;}
tr.total td{font-family:'Syne',sans-serif;font-weight:700;background:${accent};color:#fff;font-size:10px;letter-spacing:0.5px;}
tr.total td.c-amt{font-family:'DM Mono',monospace;}
.page{page-break-before:always;}
.render{width:100%;height:auto;border-radius:6px;margin:0 0 8px;page-break-inside:avoid;}
.plano-head{font-family:'DM Mono',monospace;font-size:9px;color:#6b6b6b;margin:0 0 8px;}
.plano-img{width:100%;height:auto;page-break-inside:avoid;}
.footer-block{margin-top:14px;border-top:0.5px solid #e6e2da;padding-top:10px;}
.agent{margin-top:10px;}
.agent-name{font-size:11px;}
.agent-line{font-family:'DM Mono',monospace;font-size:9px;color:#6b6b6b;}
.prepared{margin-top:10px;}
.prepared .name{font-size:11px;}
.prepared .mono{font-size:9px;color:#8a8580;}
.legal{font-size:7.5px;color:#8a8580;margin-top:10px;line-height:1.5;}
.page-footer{text-align:center;font-size:7px;color:#b0aaa2;margin-top:14px;}
</style>
</head>
<body>
  <section class="cover">
    ${coverImg}
    <div class="cover-inner">
      ${view.constructoraNombre ? `<div class="brand">${esc(view.constructoraNombre)}</div>` : ""}
      <h1>${esc(view.proyectoNombre)}</h1>
      <div class="rule"></div>
      <div class="brand">${t.quotation}</div>
      <div class="meta"><span>${t.unit} ${esc(view.unidadId)}</span><span>${esc(view.referenceNumber)}</span><span>${esc(view.fechaDisplay)}</span></div>
    </div>
  </section>

  <main>
    <div class="section">
      <div class="title" style="font-size:18px;margin-bottom:8px;">${t.salesOffer}</div>

      <div class="summary">
        <div class="grand"><span class="lbl">${t.grandTotal}</span><span class="val">${money(view.grandTotal, view)}</span></div>
      </div>

      <div class="section"><div class="label">${t.projectDetails}</div><div class="grid">${detailRows(projPairs)}</div></div>
      <div class="section"><div class="label">${t.propertyDetails}</div><div class="grid">${detailRows(propPairs)}</div></div>
    </div>

    <div class="section">
      <div class="label">${t.paymentPlan}</div>
      <table class="plan">
        <thead>
          <tr>
            <th class="c-name">${t.description}</th>
            <th class="c-pct">%</th>
            <th class="c-date">${t.date}</th>
            <th class="c-amt">${t.amount}</th>
          </tr>
        </thead>
        <tbody>
          ${view.fases.map((f) => faseRow(f, view)).join("")}
          ${descHtml}
          ${cargosHtml}
          <tr class="total"><td colspan="3" class="c-name">${t.total}</td><td class="c-amt">${money(view.grandTotal, view)}</td></tr>
        </tbody>
      </table>
    </div>

    ${rendersHtml}
    ${planoHtml}

    <div class="footer-block">
      ${agentCard}
      <div class="prepared">
        <div class="label">${t.preparedFor}</div>
        <div class="name">${esc(view.buyerNombre)}</div>
        <div class="mono">${esc(view.buyerEmail)}${view.buyerTelefono ? " · " + esc(view.buyerTelefono) : ""}</div>
      </div>
      ${view.notasLegales ? `<div class="legal"><div class="label">${t.legal}</div>${esc(view.notasLegales)}</div>` : ""}
      <div class="page-footer">${t.generatedBy}</div>
    </div>
  </main>
</body>
</html>`;
}
```

- [ ] **Step 10 — Run the build-html test (expect PASS).**

```bash
npm test src/lib/cotizador/html/__tests__/build-html.test.ts
```

Expected: `5 passed (5)`. If the page-break assertion fails, confirm the `.prow` selector emits `page-break-inside:avoid` via `table.plan tr` and the `<thead>` uses `display:table-header-group` — do NOT weaken the test.

- [ ] **Step 11 — Verify gate + commit.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass. Commit:

```bash
git add src/lib/cotizador/html/
git commit -m "feat: pure HTML builder for cotizacion (buildCotizacionData + buildCotizacionHtml)"
```

---

### Task 2: Pricing correctness — reference, do NOT duplicate

The pricing math (precio_negociado honored on issue, cargos summed into the grand total, `sum(phases) == plan total`, faithful regenerate) is owned by `docs/superpowers/plans/2026-06-25-cotizador-correctness.md`. This plan's `buildCotizacionData` **consumes** that corrected `ResultadoCotizacion` and never re-prices. This task adds ONE builder-level guard test so a regression in either plan is caught here too: it proves `buildCotizacionData`'s `grandTotal` includes cargos and equals `phaseSum + cargosTotal`.

**Files:**
- Create: `src/lib/cotizador/html/__tests__/build-data.reconcile.test.ts`

- [ ] **Step 1 — Write the test** (no implementation needed — it locks the contract `build-data.ts` already satisfies):

```ts
import { describe, it, expect } from "vitest";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
import type { BuildCotizacionDataInput } from "@/lib/cotizador/html/types";
import type { CotizadorConfig } from "@/types";

function inputFor(resultado: ReturnType<typeof calcularCotizacion>, config: CotizadorConfig): BuildCotizacionDataInput {
  return {
    resultado, config, moneda: "COP",
    proyecto: { nombre: "P", constructoraNombre: null, colorPrimario: null, ubicacionDireccion: null,
      estadoConstruccion: "sobre_planos", logoUrl: null, constructoraLogoUrl: null, coverUrl: null,
      renders: [], planoUrl: null, whatsappNumero: null, tour360Url: null },
    unidad: { identificador: "U1", tipologiaName: null, areaConstruida: null, areaPrivada: null, areaLote: null,
      areaM2: null, unidadMedida: "m²", piso: null, vista: null, habitaciones: null, banos: null,
      orientacion: null, parqueaderos: null, depositos: null, features: {} },
    agente: { nombre: null, telefono: null, email: null, avatarUrl: null },
    buyer: { nombre: "B", email: "b@x.com", telefono: null },
    complementos: [], fechaDisplay: "—", fechaEstimadaEntrega: null, referenceNumber: "R",
    paymentPlanNombre: "Plan", notasLegales: null, idioma: "es", monedaSecundaria: null, tipoCambio: null,
  };
}

const cfg = (cargos?: CotizadorConfig["cargos_adicionales"]): CotizadorConfig => ({
  moneda: "COP", separacion_incluida_en_inicial: false, descuentos: [], notas_legales: null,
  cargos_adicionales: cargos,
  fases: [
    { id: "f1", nombre: "Inicial", tipo: "porcentaje", valor: 40, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
});

describe("buildCotizacionData reconciliation", () => {
  it("grandTotal == phaseSum + cargosTotal (cargos added on top of the plan)", () => {
    const config = cfg([{ id: "iva", nombre: "IVA", tipo: "porcentaje", valor: 5 }]);
    const resultado = calcularCotizacion(200_000_000, config);
    const view = buildCotizacionData(inputFor(resultado, config));
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);
    expect(phaseSum).toBe(view.planTotal);
    expect(view.cargosTotal).toBe(10_000_000); // 5% of 200M
    expect(view.grandTotal).toBe(phaseSum + view.cargosTotal);
  });

  it("grandTotal == phaseSum when no cargos (Colombia default)", () => {
    const config = cfg();
    const resultado = calcularCotizacion(200_000_000, config);
    const view = buildCotizacionData(inputFor(resultado, config));
    const phaseSum = view.fases.reduce((s, f) => s + f.montoTotal, 0);
    expect(view.cargosTotal).toBe(0);
    expect(view.grandTotal).toBe(phaseSum);
  });
});
```

- [ ] **Step 2 — Run + verify gate + commit.**

```bash
npm test src/lib/cotizador/html/__tests__/build-data.reconcile.test.ts
npm run typecheck && npm run lint && npm test
git add src/lib/cotizador/html/__tests__/build-data.reconcile.test.ts
git commit -m "test: lock grand-total-includes-cargos invariant in buildCotizacionData"
```

Expected: `2 passed (2)`, then all gates pass.

---

### Task 3: Private bucket migration — `cotizaciones`

The current prod storage has only the public `media` bucket; the routes write PDFs to a non-existent `uploads` bucket → uploads fail, `pdf_url` is always NULL, PII PDFs (when they did land in `media`) are publicly exposed. Create a version-controlled **private** bucket `cotizaciones` (public=false) with storage RLS: owner/active-collaborator can READ objects whose first path segment is a project they're authorized for; service-role writes. Mirrors the existing `is_project_authorized(project_user_id)` helper (`supabase/migrations/20260320000000_colaboradores.sql`) and the `media` bucket migration pattern (`supabase/migrations/20260304071939_init.sql:145`).

**Files:**
- Create: `supabase/migrations/<ts>_cotizaciones_private_bucket.sql` (use the actual timestamp; format `YYYYMMDDHHMMSS_...` — e.g. `20260626140000_cotizaciones_private_bucket.sql`)

- [ ] **Step 1 — Write the migration.** Path keys are `{proyecto_id}/{cotizacion_id}.pdf`, so `(storage.foldername(name))[1]` is the `proyecto_id`. Read is scoped via that project's `user_id` through `is_project_authorized`:

```sql
-- ============================================================
-- Migration: Private bucket `cotizaciones` for quote PDFs
-- Replaces the dead writes to the non-existent `uploads` bucket.
-- PDFs contain buyer PII → bucket is PRIVATE; access via signed URLs only.
-- Read scoped to project owner/active-collaborator; writes via service-role.
-- ============================================================

-- 1. Create the private bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cotizaciones', 'cotizaciones', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. RLS read policy: object key is `{proyecto_id}/{cotizacion_id}.pdf`.
--    The first folder segment is the proyecto_id. Authorize the requester
--    against that project's owner via the existing is_project_authorized() helper.
CREATE POLICY "Authorized read cotizaciones PDFs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cotizaciones'
    AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id::text = (storage.foldername(name))[1]
        AND is_project_authorized(p.user_id)
    )
  );

-- 3. No INSERT/UPDATE/DELETE policies for authenticated/anon:
--    the service-role key bypasses RLS, so generate.ts (service-role) writes
--    and overwrites freely while no public client can write or read directly.
--    Reads from the dashboard go through service-role signed URLs (see generate.ts).

COMMENT ON POLICY "Authorized read cotizaciones PDFs" ON storage.objects
  IS 'Project owner or active collaborator may read quote PDFs for their project; bucket is otherwise private.';
```

- [ ] **Step 2 — Apply the migration.**

```bash
npm run db:migrate
```

Expected: `supabase db push` reports the new migration applied with no errors. If `is_project_authorized` is reported missing, confirm `20260320000000_colaboradores.sql` is in the applied set first (it is, per the migration list).

- [ ] **Step 3 — Verify the bucket + policy via SQL** (use the Supabase SQL editor or `supabase db` connection):

```sql
-- Bucket exists and is private
select id, public from storage.buckets where id = 'cotizaciones';
-- Expect: cotizaciones | f

-- Read policy present
select policyname, cmd from pg_policies
where schemaname = 'storage' and tablename = 'objects'
  and policyname = 'Authorized read cotizaciones PDFs';
-- Expect: one row, cmd = SELECT
```

- [ ] **Step 4 — Verify gate + commit** (migration is SQL, but run the gate to confirm nothing else regressed):

```bash
npm run typecheck && npm run lint && npm test
git add supabase/migrations/
git commit -m "feat: add private cotizaciones storage bucket with scoped read RLS"
```

---

### Task 4: Generation service — `generate.ts`

The orchestrator: `buildCotizacionHtml(buildCotizacionData(...))` → POST to `COTIZADOR_RENDER_URL/render` (header `x-render-token: RENDER_SHARED_SECRET`) → PDF buffer → upload to the private `cotizaciones` bucket at `{proyecto_id}/{cotizacion_id}.pdf` via service-role → store the object **path** in `cotizaciones.pdf_url` (NOT a public URL) → `getCotizacionSignedUrl(path)` mints a short-lived signed URL on demand → email buyer via Resend with the PDF buffer **attached**. Worker outage: fail-soft on the buyer/public path (return the record without a PDF + a retry flag), fail-loud on the agent "generate" action (throw so the route surfaces a 502). TDD the path/upload/signed-url logic with a mocked worker (fetch) and mocked supabase client.

**Files:**
- Create: `src/lib/cotizador/generate.ts`
- Create: `src/lib/cotizador/__tests__/generate.test.ts`

- [ ] **Step 1 — Write the failing test first** at `src/lib/cotizador/__tests__/generate.test.ts`. Mock `global.fetch` (the worker) and a minimal supabase storage client; assert the worker is called with the right header, the upload path is `{proyecto_id}/{cotizacion_id}.pdf`, the stored value is the PATH (not a URL), and the signed-url helper calls `createSignedUrl`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  renderCotizacionPdf,
  uploadCotizacionPdf,
  getCotizacionSignedUrl,
  cotizacionPdfPath,
} from "@/lib/cotizador/generate";

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.COTIZADOR_RENDER_URL = "https://noddo-render.up.railway.app";
  process.env.RENDER_SHARED_SECRET = "test-secret";
});

describe("cotizacionPdfPath", () => {
  it("builds {proyecto_id}/{cotizacion_id}.pdf", () => {
    expect(cotizacionPdfPath("proj-1", "cot-9")).toBe("proj-1/cot-9.pdf");
  });
});

describe("renderCotizacionPdf", () => {
  it("POSTs HTML to the worker with the shared-secret header and returns the PDF buffer", async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdfBytes, { status: 200, headers: { "Content-Type": "application/pdf" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const buf = await renderCotizacionPdf("<!DOCTYPE html><html></html>");
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(0);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://noddo-render.up.railway.app/render");
    expect((init as RequestInit).method).toBe("POST");
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers["x-render-token"]).toBe("test-secret");
  });

  it("throws on a non-200 worker response (fail-loud at this layer)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("boom", { status: 500 })));
    await expect(renderCotizacionPdf("<html></html>")).rejects.toThrow(/render worker/i);
  });
});

describe("uploadCotizacionPdf", () => {
  it("uploads to the private bucket and returns the object PATH (not a URL)", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ upload });
    const supabase = { storage: { from } } as any;

    const path = await uploadCotizacionPdf(supabase, "proj-1", "cot-9", Buffer.from("%PDF"));
    expect(from).toHaveBeenCalledWith("cotizaciones");
    expect(upload).toHaveBeenCalledWith(
      "proj-1/cot-9.pdf",
      expect.any(Buffer),
      expect.objectContaining({ contentType: "application/pdf", upsert: true }),
    );
    expect(path).toBe("proj-1/cot-9.pdf"); // PATH, not a public URL
  });

  it("throws when the upload errors", async () => {
    const upload = vi.fn().mockResolvedValue({ error: { message: "denied" } });
    const supabase = { storage: { from: () => ({ upload }) } } as any;
    await expect(
      uploadCotizacionPdf(supabase, "p", "c", Buffer.from("x")),
    ).rejects.toThrow(/denied/);
  });
});

describe("getCotizacionSignedUrl", () => {
  it("mints a short-lived signed URL for the stored path", async () => {
    const createSignedUrl = vi
      .fn()
      .mockResolvedValue({ data: { signedUrl: "https://signed/url?token=abc" }, error: null });
    const supabase = { storage: { from: () => ({ createSignedUrl }) } } as any;

    const url = await getCotizacionSignedUrl(supabase, "proj-1/cot-9.pdf");
    expect(createSignedUrl).toHaveBeenCalledWith("proj-1/cot-9.pdf", expect.any(Number));
    expect(url).toBe("https://signed/url?token=abc");
  });

  it("returns null on a signing error (caller decides UX)", async () => {
    const createSignedUrl = vi.fn().mockResolvedValue({ data: null, error: { message: "x" } });
    const supabase = { storage: { from: () => ({ createSignedUrl }) } } as any;
    expect(await getCotizacionSignedUrl(supabase, "p/c.pdf")).toBeNull();
  });
});
```

- [ ] **Step 2 — Run it (expect FAIL).**

```bash
npm test src/lib/cotizador/__tests__/generate.test.ts
```

Expected: FAIL — module/exports not found.

- [ ] **Step 3 — Create `src/lib/cotizador/generate.ts`** (the REAL service). Uses the `SupabaseClient` type from `@supabase/supabase-js` for the injected client so routes can pass their service-role client:

```ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildCotizacionData } from "./html/build-data";
import { buildCotizacionHtml } from "./html/build-html";
import type { BuildCotizacionDataInput } from "./html/types";

const BUCKET = "cotizaciones";
/** Signed URL lifetime for dashboard/email links (seconds). */
const SIGNED_URL_TTL = 60 * 15; // 15 minutes

export function cotizacionPdfPath(proyectoId: string, cotizacionId: string): string {
  return `${proyectoId}/${cotizacionId}.pdf`;
}

/**
 * Render an HTML string to a PDF via the Railway Chromium worker.
 * Fail-LOUD here: throws on missing config or non-200. Callers wrap this
 * in their own fail-soft/fail-loud policy (buyer path vs agent action).
 */
export async function renderCotizacionPdf(
  html: string,
  opts: { format?: "A4" | "Letter"; landscape?: boolean } = {},
): Promise<Buffer> {
  const base = process.env.COTIZADOR_RENDER_URL;
  const secret = process.env.RENDER_SHARED_SECRET;
  if (!base || !secret) {
    throw new Error(
      "[cotizador/generate] COTIZADOR_RENDER_URL or RENDER_SHARED_SECRET not configured",
    );
  }

  const res = await fetch(`${base.replace(/\/$/, "")}/render`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-render-token": secret,
    },
    body: JSON.stringify({ html, format: opts.format ?? "Letter", landscape: opts.landscape ?? false }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    throw new Error(`[cotizador/generate] render worker returned ${res.status}: ${detail.slice(0, 300)}`);
  }

  const arrayBuf = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  if (buf.length < 100) {
    throw new Error(`[cotizador/generate] render worker returned ${buf.length} bytes — likely a blank render`);
  }
  return buf;
}

/**
 * Upload the PDF to the PRIVATE `cotizaciones` bucket (service-role client).
 * Returns the object PATH to persist in cotizaciones.pdf_url (NOT a public URL).
 */
export async function uploadCotizacionPdf(
  supabase: SupabaseClient,
  proyectoId: string,
  cotizacionId: string,
  pdf: Buffer,
): Promise<string> {
  const path = cotizacionPdfPath(proyectoId, cotizacionId);
  const { error } = await supabase.storage.from(BUCKET).upload(path, pdf, {
    contentType: "application/pdf",
    upsert: true, // idempotent re-render by cotizacion id
  });
  if (error) {
    throw new Error(`[cotizador/generate] PDF upload failed: ${error.message}`);
  }
  return path;
}

/**
 * Mint a short-lived signed URL for a stored PDF path. Returns null on error
 * so callers can degrade gracefully (e.g. show "PDF generándose…").
 */
export async function getCotizacionSignedUrl(
  supabase: SupabaseClient,
  path: string,
  ttlSeconds: number = SIGNED_URL_TTL,
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, ttlSeconds);
  if (error || !data?.signedUrl) {
    console.warn("[cotizador/generate] createSignedUrl failed:", error?.message);
    return null;
  }
  return data.signedUrl;
}

export interface GenerateCotizacionPdfResult {
  /** Object path stored in cotizaciones.pdf_url. null if rendering/upload failed (fail-soft). */
  pdfPath: string | null;
  /** The rendered PDF buffer (for email attachment), or null on failure. */
  pdfBuffer: Buffer | null;
  /** Set when the worker/upload failed and the caller should surface/retry. */
  error: string | null;
}

/**
 * Full pipeline: data → html → worker PDF → upload → return path + buffer.
 *
 * @param failSoft When true (buyer/public path), swallows worker outages and
 *   returns { pdfPath: null, pdfBuffer: null, error } so lead capture never
 *   breaks. When false (agent "generate" action), re-throws so the route 502s.
 */
export async function generateCotizacionPdf(
  supabase: SupabaseClient,
  proyectoId: string,
  cotizacionId: string,
  input: BuildCotizacionDataInput,
  failSoft: boolean,
): Promise<GenerateCotizacionPdfResult> {
  try {
    const view = buildCotizacionData(input);
    const html = buildCotizacionHtml(view);
    const pdfBuffer = await renderCotizacionPdf(html);
    const pdfPath = await uploadCotizacionPdf(supabase, proyectoId, cotizacionId, pdfBuffer);
    return { pdfPath, pdfBuffer, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "render failed";
    console.error("[cotizador/generate] generateCotizacionPdf failed:", message);
    if (!failSoft) throw err;
    return { pdfPath: null, pdfBuffer: null, error: message };
  }
}
```

- [ ] **Step 4 — Run it (expect PASS).**

```bash
npm test src/lib/cotizador/__tests__/generate.test.ts
```

Expected: all describe blocks pass. (`generateCotizacionPdf` is exercised end-to-end in Task 5's route wiring; its units are covered by the render/upload/signed-url tests here.)

- [ ] **Step 5 — Verify gate + commit.**

```bash
npm run typecheck && npm run lint && npm test
git add src/lib/cotizador/generate.ts src/lib/cotizador/__tests__/generate.test.ts
git commit -m "feat: cotizacion generation service (worker render → private upload → signed URL)"
```

---

### Task 5: Wire the routes to `generate.ts` (swap the renderer; private path; remove pdf-react/jsPDF)

Rewire all four routes to build the `BuildCotizacionDataInput` from the data they already fetch and call `generate.ts` instead of `@/lib/cotizador/pdf-react/render`. Store the object PATH in `pdf_url` (not a public URL). Stop returning a public URL to clients — return the id and serve via a signed URL. `regenerate` renders from the STORED snapshot (`config_snapshot`/`unidad_snapshot`/`resultado`) — NOT the project's current config (it already consumes `resultado` if the correctness plan landed; otherwise recompute from snapshot config, never current). After parity, delete `pdf-react/` + `generar-pdf.ts` (the jsPDF fallback). Map each route's existing fetched fields to the new `BuildCotizacionDataInput` (the field mapping is mechanical — the routes already fetch every value: see `route.ts:248-500` and `preview/route.ts:155-357`).

**Files:**
- Modify: `src/app/api/cotizaciones/route.ts` (replace `generarPDF` import + call `:6,:510-586`; replace upload block `:624-639`; return `:783`)
- Modify: `src/app/api/cotizaciones/preview/route.ts` (replace `generarPDF` import + call `:5,:371-455`)
- Modify: `src/app/api/cotizaciones/[id]/regenerate/route.ts` (replace `generarPDF` import + call `:5,:159-249`; render from snapshot)
- Modify: `src/app/api/cotizaciones/[id]/resend/route.ts` (replace `fetch(pdf_url)` `:46-54` with `getCotizacionSignedUrl` + download, OR re-render from snapshot)
- Modify: `src/app/api/cotizaciones/[id]/route.ts` *(if it exists — the GET-one endpoint must return a signed URL; if not present, the list endpoint in `route.ts` GET should map `pdf_url` paths → signed URLs)*
- Create: `src/app/api/cotizaciones/__tests__/build-input-mapping.test.ts` (unit test the mapping helper)
- Delete (after parity): `src/lib/cotizador/pdf-react/` (document.tsx, render.tsx, fonts.ts, theme.ts) and `src/lib/cotizador/generar-pdf.ts`

> DECISION GATE: `regenerate` semantics. Per the correctness plan, regenerate is a **faithful reissue** — render from the stored `config_snapshot` + stored `resultado`, only refreshing layout/branding; never re-price against the project's current config. This plan assumes branch (A) faithful reissue. If the owner wants branch (B) "re-price to current terms", that is a separate explicit action — do NOT ship it silently under "regenerate". Proceed with (A).

- [ ] **Step 1 — Write a failing test for a small mapping helper** at `src/app/api/cotizaciones/__tests__/build-input-mapping.test.ts`. To keep the heavy route handlers thin and testable, extract the "DB rows → `BuildCotizacionDataInput`" mapping into a pure helper `buildInputFromDbRows` co-located in `generate.ts` (or a new `html/from-db.ts`). Test that it maps the project/unit/resultado correctly:

```ts
import { describe, it, expect } from "vitest";
import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
import { calcularCotizacion } from "@/lib/cotizador/calcular";
import type { CotizadorConfig } from "@/types";

const config: CotizadorConfig = {
  moneda: "COP", separacion_incluida_en_inicial: false, descuentos: [], notas_legales: "Legal X",
  fases: [
    { id: "f1", nombre: "Inicial", tipo: "porcentaje", valor: 30, cuotas: 1, frecuencia: "unica" },
    { id: "f2", nombre: "Saldo", tipo: "resto", valor: 0, cuotas: 1, frecuencia: "unica" },
  ],
};

describe("buildInputFromDbRows", () => {
  it("maps project + unit snapshot + resultado into BuildCotizacionDataInput", () => {
    const resultado = calcularCotizacion(250_000_000, config);
    const input = buildInputFromDbRows({
      resultado, config, moneda: "COP",
      proyecto: {
        nombre: "Garden Houses", constructora_nombre: "Demo SAS", color_primario: "#2e5d4a",
        ubicacion_direccion: "Vereda X", estado_construccion: "en_construccion",
        logo_url: "https://x/logo.png", constructora_logo_url: null,
        cover_url: "https://x/cover.jpg", renders: ["https://x/r1.jpg"], plano_url: "https://x/plano.jpg",
        whatsapp_numero: "+57300", tour_360_url: null,
      },
      unidadSnapshot: {
        identificador: "Casa 4", tipologia: "Tipo B", area_construida: 120, area_privada: 110,
        area_lote: 200, area_m2: 120, piso: null, vista: "Bosque", habitaciones: 4, banos: 3,
        orientacion: "Sur", tiene_terraza: true,
      },
      unidadMedida: "m²",
      agente: { nombre: "Carlos", telefono: "+57301", email: "c@x.com", avatarUrl: null },
      buyer: { nombre: "Marta", email: "m@x.com", telefono: "+57302" },
      complementos: [],
      fechaDisplay: "26 de junio de 2026", fechaEstimadaEntrega: "2028", referenceNumber: "COT-1",
      paymentPlanNombre: "Plan", idioma: "es", monedaSecundaria: null, tipoCambio: null,
    });

    expect(input.proyecto.nombre).toBe("Garden Houses");
    expect(input.proyecto.colorPrimario).toBe("#2e5d4a");
    expect(input.unidad.identificador).toBe("Casa 4");
    expect(input.unidad.features.tiene_terraza).toBe(true);
    expect(input.notasLegales).toBe("Legal X");
    expect(input.resultado.precio_base).toBe(250_000_000);
  });
});
```

- [ ] **Step 2 — Run it (expect FAIL).**

```bash
npm test src/app/api/cotizaciones/__tests__/build-input-mapping.test.ts
```

Expected: FAIL — `@/lib/cotizador/html/from-db` missing.

- [ ] **Step 3 — Create `src/lib/cotizador/html/from-db.ts`** with `buildInputFromDbRows` (a pure mapper from the loose DB shapes to `BuildCotizacionDataInput`). It collects the snapshot's `tiene_*` keys into `features`:

```ts
import type { BuildCotizacionDataInput } from "./types";
import type { CotizadorConfig, ResultadoCotizacion, ComplementoSeleccion, Currency } from "@/types";
import type { EmailLocale } from "@/lib/email-i18n";

interface DbRowsInput {
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  moneda: Currency;
  proyecto: {
    nombre: string;
    constructora_nombre: string | null;
    color_primario: string | null;
    ubicacion_direccion: string | null;
    estado_construccion: "sobre_planos" | "en_construccion" | "entregado" | null;
    logo_url: string | null;
    constructora_logo_url: string | null;
    cover_url: string | null;
    renders: string[];
    plano_url: string | null;
    whatsapp_numero: string | null;
    tour_360_url: string | null;
  };
  unidadSnapshot: Record<string, unknown>;
  unidadMedida: string;
  agente: { nombre: string | null; telefono: string | null; email: string | null; avatarUrl: string | null };
  buyer: { nombre: string; email: string; telefono: string | null };
  complementos: ComplementoSeleccion[];
  fechaDisplay: string;
  fechaEstimadaEntrega: string | null;
  referenceNumber: string;
  paymentPlanNombre: string;
  idioma: EmailLocale;
  monedaSecundaria: Currency | null;
  tipoCambio: number | null;
}

function asNum(v: unknown): number | null {
  return typeof v === "number" ? v : null;
}
function asStr(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Collect the snapshot's boolean `tiene_*`/amenity flags into a features map. */
function extractFeatures(snap: Record<string, unknown>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(snap)) {
    if (k.startsWith("tiene_") && v === true) out[k] = true;
  }
  if (snap.amoblado === true) out.amoblado = true;
  return out;
}

export function buildInputFromDbRows(i: DbRowsInput): BuildCotizacionDataInput {
  const snap = i.unidadSnapshot;
  return {
    resultado: i.resultado,
    config: i.config,
    moneda: i.moneda,
    proyecto: {
      nombre: i.proyecto.nombre,
      constructoraNombre: i.proyecto.constructora_nombre,
      colorPrimario: i.proyecto.color_primario,
      ubicacionDireccion: i.proyecto.ubicacion_direccion,
      estadoConstruccion: i.proyecto.estado_construccion,
      logoUrl: i.proyecto.logo_url,
      constructoraLogoUrl: i.proyecto.constructora_logo_url,
      coverUrl: i.proyecto.cover_url,
      renders: i.proyecto.renders ?? [],
      planoUrl: i.proyecto.plano_url,
      whatsappNumero: i.proyecto.whatsapp_numero,
      tour360Url: i.proyecto.tour_360_url,
    },
    unidad: {
      identificador: asStr(snap.identificador) ?? "—",
      tipologiaName: asStr(snap.tipologia),
      areaConstruida: asNum(snap.area_construida),
      areaPrivada: asNum(snap.area_privada),
      areaLote: asNum(snap.area_lote),
      areaM2: asNum(snap.area_m2),
      unidadMedida: i.unidadMedida,
      piso: asNum(snap.piso),
      vista: asStr(snap.vista),
      habitaciones: asNum(snap.habitaciones),
      banos: asNum(snap.banos),
      orientacion: asStr(snap.orientacion),
      parqueaderos: asNum(snap.parqueaderos),
      depositos: asNum(snap.depositos),
      features: extractFeatures(snap),
    },
    agente: i.agente,
    buyer: i.buyer,
    complementos: i.complementos,
    fechaDisplay: i.fechaDisplay,
    fechaEstimadaEntrega: i.fechaEstimadaEntrega,
    referenceNumber: i.referenceNumber,
    paymentPlanNombre: i.paymentPlanNombre,
    notasLegales: i.config.notas_legales ?? null,
    idioma: i.idioma,
    monedaSecundaria: i.monedaSecundaria,
    tipoCambio: i.tipoCambio,
  };
}
```

- [ ] **Step 4 — Run the mapping test (expect PASS).**

```bash
npm test src/app/api/cotizaciones/__tests__/build-input-mapping.test.ts
```

Expected: `1 passed (1)`.

- [ ] **Step 5 — Rewire `POST /api/cotizaciones`.** In `src/app/api/cotizaciones/route.ts`:
  - Replace the import `import { generarPDF } from "@/lib/cotizador/pdf-react/render";` (`:6`) with:
    ```ts
    import { generateCotizacionPdf, getCotizacionSignedUrl } from "@/lib/cotizador/generate";
    import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
    ```
  - The route already fetches `coverUrl`, `tipologiaRenders`, `tipologiaPlanoUrl`, agent fields, `effectiveConfig`, `resultado`, `unidadSnapshot`, etc. Replace the whole `const pdfBuffer = await generarPDF({ ... huge object ... });` call (`:510-586`) with: build the input via `buildInputFromDbRows`, then call `generateCotizacionPdf`. The buyer-facing public POST is **fail-soft**; the agent-initiated POST (when `agente_id` is present) is **fail-loud**. Use:
    ```ts
    const input = buildInputFromDbRows({
      resultado,
      config: effectiveConfig,
      moneda,
      proyecto: {
        nombre: proyecto.nombre,
        constructora_nombre: proyecto.constructora_nombre,
        color_primario: proyecto.color_primario,
        ubicacion_direccion: proyecto.ubicacion_direccion ?? null,
        estado_construccion: proyecto.estado_construccion ?? "sobre_planos",
        logo_url: config.pdf_logo_proyecto_url || proyecto.logo_url,
        constructora_logo_url: config.pdf_logo_constructora_url || proyecto.constructora_logo_url,
        cover_url: coverUrl,
        renders: tipologiaRenders,
        plano_url: tipologiaPlanoUrl,
        whatsapp_numero: proyecto.whatsapp_numero,
        tour_360_url: proyecto.tour_360_url,
      },
      unidadSnapshot, // built at :589 — move its construction ABOVE this block
      unidadMedida: proyecto.unidad_medida_base === "sqft" ? "sqft" : "m²",
      agente: { nombre: agenteNombreCompleto, telefono: agenteTelefono, email: agenteEmail, avatarUrl: agenteAvatarUrl },
      buyer: { nombre: sanitize(nombre, 200), email: sanitize(email, 320), telefono: telefono ? sanitize(telefono, 30) : null },
      complementos: complementoSelecciones,
      fechaDisplay: fecha,
      fechaEstimadaEntrega: deliveryContext && effectiveConfig.tipo_entrega
        ? formatDeliveryDisplay(deliveryContext, effectiveConfig.tipo_entrega)
        : effectiveConfig.fecha_estimada_entrega ?? null,
      referenceNumber: refNumber,
      paymentPlanNombre: effectiveConfig.payment_plan_nombre ?? (projectLocale === "en" ? "Payment Plan" : "Plan de Pagos"),
      idioma: projectLocale,
      monedaSecundaria: moneda_secundaria ?? null,
      tipoCambio: tipo_cambio ?? null,
    });

    const isAgentAction = !!agente_id;
    const { pdfPath, pdfBuffer, error: renderError } = await generateCotizacionPdf(
      supabase, proyecto_id, cotizacionId, input, /* failSoft */ !isAgentAction,
    );
    ```
    (Note: `unidadSnapshot` is currently built at `:589`, AFTER the old PDF call. Move its construction to before this block so it can feed `buildInputFromDbRows`.)
  - Replace the upload block (`:624-639`) — delete the `uploads`-bucket upload entirely; the path now comes from `generateCotizacionPdf`. Persist the PATH:
    ```ts
    const pdfUrl = pdfPath; // object PATH in the private bucket, NOT a public URL
    ```
    Keep `pdf_url: pdfUrl` in the insert (`:654`).
  - In the webhook payload (`:679`) and the success response (`:783`), do NOT leak the raw object path as if it were a downloadable URL. Mint a signed URL for the agent response:
    ```ts
    const signedUrl = pdfPath ? await getCotizacionSignedUrl(supabase, pdfPath) : null;
    // ...
    return NextResponse.json(
      { id: cotizacionId, pdf_url: signedUrl, pdf_pending: pdfPath === null },
      { status: 201 },
    );
    ```
    (The success card consumes `pdf_url` as before — now it is a short-lived signed URL. `pdf_pending` lets the UI show a retry/regenerate hint on a worker outage.)
  - The email already attaches `pdfBuffer` (`:739`). Guard it: only send the buyer email when `pdfBuffer` is non-null (skip silently on a fail-soft outage; the agent can regenerate). Wrap the existing `sendCotizacionBuyer({...})` call in `if (pdfBuffer) { ... }`.

- [ ] **Step 6 — Rewire `preview/route.ts`.** Preview returns the PDF bytes inline (no storage). Replace `generarPDF(...)` (`:371-447`) with:
  ```ts
  import { renderCotizacionPdf } from "@/lib/cotizador/generate";
  import { buildCotizacionData } from "@/lib/cotizador/html/build-data";
  import { buildCotizacionHtml } from "@/lib/cotizador/html/build-html";
  import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
  // ...
  const input = buildInputFromDbRows({ /* same mapping as Task 5 Step 5, buyer = preview defaults */ });
  const html = buildCotizacionHtml(buildCotizacionData(input));
  const pdfBuffer = await renderCotizacionPdf(html);
  ```
  Keep the existing inline `NextResponse` (`:449-455`). Preview is **fail-loud** (the agent is actively previewing) — if the worker is down, return a 502 JSON so the UI shows a clear error instead of a blank PDF.

- [ ] **Step 7 — Rewire `[id]/regenerate/route.ts` (faithful reissue from snapshot).** Replace `generarPDF(...)` (`:159-223`) + the `uploads` upload (`:226-239`) with `generateCotizacionPdf`. Build the input from `cotizacion.config_snapshot` (NOT `proyectos.cotizador_config`), `cotizacion.unidad_snapshot`, and the stored `cotizacion.resultado` (re-use it; do not recompute). This route is an explicit agent action → **fail-loud**:
  ```ts
  import { generateCotizacionPdf } from "@/lib/cotizador/generate";
  import { buildInputFromDbRows } from "@/lib/cotizador/html/from-db";
  // ...
  const config = (cotizacion.config_snapshot ?? cotizacion.proyectos.cotizador_config) as CotizadorConfig;
  const resultado = cotizacion.resultado as ResultadoCotizacion; // issued numbers — faithful reissue
  const input = buildInputFromDbRows({ resultado, config, /* project + unidadSnapshot from cotizacion */ ... });
  const { pdfPath } = await generateCotizacionPdf(
    supabase, cotizacion.proyecto_id, id, input, /* failSoft */ false,
  );
  await supabase.from("cotizaciones").update({ pdf_url: pdfPath }).eq("id", id);
  // do NOT overwrite resultado / config_snapshot (the issued record is the legal copy)
  const signedUrl = pdfPath ? await getCotizacionSignedUrl(supabase, pdfPath) : null;
  return NextResponse.json({ success: true, pdf_url: signedUrl });
  ```

- [ ] **Step 8 — Rewire `[id]/resend/route.ts`.** The PDF is now a private object PATH, so `fetch(pdf_url)` (`:50`) no longer works. Replace with: download the stored object via service-role, OR re-render from snapshot, then attach. Simplest + robust — download the bytes via the service-role client:
  ```ts
  // Replace the fetch(cotizacion.pdf_url) block (:46-54) with:
  if (!cotizacion.pdf_url) {
    return NextResponse.json({ error: "PDF no disponible" }, { status: 400 });
  }
  const { data: blob, error: dlErr } = await supabase.storage
    .from("cotizaciones")
    .download(cotizacion.pdf_url); // pdf_url is now the object PATH
  if (dlErr || !blob) {
    return NextResponse.json({ error: "PDF no disponible" }, { status: 500 });
  }
  const pdfBuffer = Buffer.from(await blob.arrayBuffer());
  ```
  (Keep the rest of the resend flow unchanged — it already attaches `pdfBuffer` to `sendCotizacionBuyer`.)

- [ ] **Step 9 — Serve signed URLs on the list/detail GET.** The dashboard list (`route.ts` GET, `:96`) returns rows whose `pdf_url` is now a PATH. The client cannot download a private path. Map each row's `pdf_url` → a signed URL before returning (cap to the page size so it is cheap):
  ```ts
  // After fetching `cotizaciones`, before NextResponse.json:
  const withSigned = await Promise.all(
    (cotizaciones ?? []).map(async (c: { pdf_url: string | null }) => ({
      ...c,
      pdf_url: c.pdf_url ? await getCotizacionSignedUrl(supabase, c.pdf_url) : null,
    })),
  );
  // return { cotizaciones: withSigned, ... }
  ```
  (Import `getCotizacionSignedUrl` at the top of `route.ts`.)

- [ ] **Step 10 — Remove the dead renderer after parity.** Once typecheck/lint/tests are green and a manual preview renders, delete the old renderer + jsPDF fallback:
  ```bash
  git rm -r src/lib/cotizador/pdf-react/
  git rm src/lib/cotizador/generar-pdf.ts
  ```
  Then fix the now-broken `import type { PDFData }` references: the only consumers were the routes (now rewired) and `generar-pdf.ts` itself. Grep to confirm nothing else imports them:
  ```bash
  grep -rn "pdf-react\|generar-pdf\|PDFData" src/ --include="*.ts" --include="*.tsx"
  ```
  Expected: zero matches after the rewire (or only the deleted files). Resolve any stragglers (e.g. a leftover `import type { EmailLocale }` that was only used by the old PDF) by inlining `EmailLocale` where still needed.

- [ ] **Step 11 — Verify gate.**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all pass. If TS complains that `jspdf` / `@react-pdf/renderer` are now unused deps, leave the packages (removing from `package.json` is optional cleanup — note it for a follow-up `chore:` commit, don't block).

- [ ] **Step 12 — Manual parity check (with a mocked or live worker).** If `COTIZADOR_RENDER_URL` is set to a deployed worker: `npm run dev`, open a cotizador-enabled project, create a quote, confirm the success card "Descargar PDF" opens a real PDF with the cover render, correct grand total (incl. cargos), a payment table whose header repeats across pages with many cuotas (use an 18-cuota plan), the floor plan, and the agent card. If no worker yet, this is verified by the unit tests + Task 4 mocks; mark the live check as pending-staging per `WORKFLOW.md`.

- [ ] **Step 13 — Commit.**

```bash
git add src/app/api/cotizaciones/ src/lib/cotizador/html/from-db.ts
git commit -m "feat: route cotizacion PDF through worker + private bucket; remove pdf-react/jsPDF"
```

---

### Task 6: NodDo Quote success card — working "Descargar PDF" on creation

The agent's "Cotización generada" success card already has a "Descargar PDF" `<a>` gated on `successState.pdfUrl` (`src/components/dashboard/cotizador/CotizadorTool.tsx:1140-1173`), and `handleGenerate` already consumes `{ id, pdf_url }` from the POST response (`:953-962`). Task 5 Step 5 now returns a short-lived **signed** URL as `pdf_url`, so the existing button works the instant the quote is created. This task hardens the UX for the fail-soft case (worker outage → `pdf_url: null`, `pdf_pending: true`) so the agent gets a clear "Regenerar PDF" affordance instead of three dead buttons.

**Files:**
- Modify: `src/components/dashboard/cotizador/CotizadorTool.tsx` (`successState` type `:292-298`; response handler `:953-962`; success-card JSX `:1140-1173`)

- [ ] **Step 1 — Read the current success card + handler.**

```bash
grep -n "successState\|pdf_url\|pdfUrl\|Descargar PDF\|pdf_pending" src/components/dashboard/cotizador/CotizadorTool.tsx
```

- [ ] **Step 2 — Thread `pdf_pending` into success state.** In the `successState` type (`:292-298`) add `pdfPending: boolean;`. In the response handler (`:953-962`), read the new field:
  ```ts
  const { id, pdf_url, pdf_pending } = await res.json();
  setSuccessState({
    id,
    pdfUrl: pdf_url,
    pdfPending: !!pdf_pending,
    clientName: effectiveClientName.trim(),
    unitId: selectedUnit.identificador,
    total,
  });
  ```

- [ ] **Step 3 — Add a "Regenerar PDF" fallback to the success card.** Where the three `successState.pdfUrl &&` buttons live (`:1140-1173`), add an `else` branch for the pending state that POSTs to `/api/cotizaciones/${successState.id}/regenerate` and, on success, swaps `pdfUrl` in (the regenerate route now returns a signed `pdf_url`):
  ```tsx
  {!successState.pdfUrl && successState.pdfPending && (
    <button
      onClick={async () => {
        const r = await fetch(`/api/cotizaciones/${successState.id}/regenerate`, { method: "POST" });
        if (r.ok) {
          const { pdf_url } = await r.json();
          setSuccessState((s) => (s ? { ...s, pdfUrl: pdf_url, pdfPending: false } : s));
          toast.success(t("cotizadorPage.pdfReady"));
        } else {
          toast.error(t("cotizadorPage.pdfRetryFailed"));
        }
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--site-primary)] text-[var(--surface-0)] font-ui text-[10px] font-bold uppercase tracking-[0.1em] hover:brightness-110 transition-all"
    >
      <Download size={12} />
      Regenerar PDF
    </button>
  )}
  ```
  (Add the two i18n keys `cotizadorPage.pdfReady` / `cotizadorPage.pdfRetryFailed` to the locale files the component already uses — grep `cotizadorPage.linkCopied` to find them.)

- [ ] **Step 4 — Verify gate + commit.**

```bash
npm run typecheck && npm run lint && npm test
git add src/components/dashboard/cotizador/CotizadorTool.tsx src/i18n/  # adjust to the real locale path
git commit -m "feat: success card download works on creation + regenerate fallback on outage"
```

Expected: all gates pass. (The download button itself needs no change — Task 5 makes `pdf_url` a working signed URL.)

---

### Task 7: Resend verification — confirm the buyer email actually fires with the PDF attached

`sendCotizacionBuyer` (`src/lib/email.ts:110`) no-ops when `RESEND_API_KEY` is unset (`getResend()` returns null → warns + returns). Confirm `RESEND_API_KEY` is set in NODDO's Vercel (prod + preview) and that a generated cotización actually sends the email with the PDF buffer attached. This is a verification/ops task — no production code change required unless the send is found broken.

**Files:**
- Modify (only if a fix is needed): `src/lib/email.ts` and/or `src/app/api/cotizaciones/route.ts`
- Create (documentation of the check): append a short "Resend verification" note to this plan's changelog or a `docs/` note (do NOT create a stray README).

- [ ] **Step 1 — Confirm the env var in Vercel.** Ask the owner to confirm (or run, if the Vercel CLI is authenticated for the NODDO project):
  ```bash
  vercel env ls
  # Expect RESEND_API_KEY present for Production AND Preview
  ```
  If missing, the owner adds it: `vercel env add RESEND_API_KEY production` (and `preview`). Also confirm `RESEND_FROM_EMAIL` (defaults to `NODDO <notificaciones@noddo.io>` if unset — verify that domain is verified in Resend).

- [ ] **Step 2 — Confirm the attachment path is taken.** In `sendCotizacionBuyer`, the PDF is attached unless `emailConfig.adjuntar_cotizacion_pdf === false` (`:177`). Verify the test project's `email_config` does not disable it. The attachment is the `pdfBuffer` passed from the route (now the worker-rendered buffer). Confirm Task 5 Step 5 only calls `sendCotizacionBuyer` when `pdfBuffer` is non-null.

- [ ] **Step 3 — Live test-send (staging/preview).** With `RESEND_API_KEY` set and the worker deployed, create a cotización against a test project using a real inbox as the buyer email. Confirm: the email arrives, subject is "su cotización del proyecto …" (from `s.cotizacionBuyer.subject`), and the PDF is attached and opens. If `getResend()` returns null in logs (`[email] RESEND_API_KEY not configured — skipping cotización email`), the env var is missing — fix per Step 1.

- [ ] **Step 4 — Record the result.** Add a one-line note under this plan's "Verification log" (Step appended at the end). No code commit needed unless Step 2/3 surfaced a bug; if it did, fix + add a regression test in `src/lib/cotizador/__tests__/` mocking `resend.emails.send` and asserting `attachments[0].content === pdfBuffer`, then commit `fix: …`.

---

### Task 8: Env vars — `COTIZADOR_RENDER_URL` + `RENDER_SHARED_SECRET`

Add the two new worker env vars to `.env.example` (under a new "Cotizador Render Worker" section) with a note to set them in Vercel (prod + preview). These are consumed by `generate.ts` (`renderCotizacionPdf`).

**Files:**
- Modify: `.env.example`

- [ ] **Step 1 — Add the section.** In `.env.example`, after the "Email (Resend)" block (`:30`), insert:

```bash
# ─── Cotizador Render Worker (Railway) ────────────────────────────────
# The Chromium HTML→PDF worker (sibling repo / render-worker/). Used by
# src/lib/cotizador/generate.ts to render cotización PDFs server-side.
# Set BOTH in Vercel for Production AND Preview once the worker is deployed.
# DEV: point at a local worker or a staging Railway URL.
COTIZADOR_RENDER_URL=https://noddo-render.up.railway.app
# Shared secret sent as the `x-render-token` header; must match the worker's
# RENDER_SHARED_SECRET env. Generate a long random value (e.g. openssl rand -hex 32).
RENDER_SHARED_SECRET=replace-with-a-long-random-secret
```

- [ ] **Step 2 — Verify gate + commit** (docs-only, but run the gate):

```bash
npm run typecheck && npm run lint && npm test
git add .env.example
git commit -m "docs: add COTIZADOR_RENDER_URL + RENDER_SHARED_SECRET to .env.example"
```

- [ ] **Step 3 — Owner action (note, not a code step).** The owner sets both vars in the NODDO Vercel project (Production + Preview) with the deployed worker URL and the matching secret. Until then, `generate.ts` throws on render (caught fail-soft on the buyer path; fail-loud on agent actions, which is correct — the agent sees "configure the render worker").

---

## Task dependency / order

```
Task 1 (HTML builder: build-data + build-html + fonts-base64)   ── foundation; nothing depends on the worker
   ├─> Task 2 (builder reconciliation test)                     ── depends on Task 1
   └─> Task 4 (generate.ts: render + upload + signed URL)       ── depends on Task 1 (imports build-data/build-html)
         └─> Task 5 (wire routes + from-db mapper + remove old) ── depends on Task 4 (and Task 3 for the bucket)
               ├─> Task 6 (success card download + regenerate)  ── depends on Task 5's response shape
               └─> Task 7 (Resend verification)                 ── depends on Task 5 (email now carries the worker PDF)
Task 3 (private bucket migration)   ── independent; MUST land before Task 5's upload runs against a real DB
Task 8 (env vars)                   ── independent; needed for end-to-end (Task 5/7 live runs), not for unit tests

External dependency: the sibling worker plan 2026-06-26-cotizador-render-worker.md must be
deployed and COTIZADOR_RENDER_URL set for the pipeline to run END-TO-END. ALL code and tests
in Tasks 1–6 are built/verified against a MOCKED worker (Task 4 mocks fetch) and need no Railway.
```

- Tasks 1, 3, 8 can start in parallel (different files: `html/`, a migration, `.env.example`).
- Task 4 needs Task 1. Task 5 needs Task 4 + Task 3. Tasks 6, 7 need Task 5.
- The **pricing-correctness plan** (`2026-06-25-cotizador-correctness.md`) is a soft prerequisite: land it first so `calcular.ts` already honors `precio_negociado` + cargos-in-total + reconciliation. If it has not landed, Tasks 1–8 are still mergeable (they consume `resultado` as-is and never re-price), but the headline numbers will only be fully correct once the correctness plan lands too.

## Per-task effort estimate

| Task | Scope | Estimate |
|------|-------|----------|
| 1 | HTML builder (data + html + fonts) with golden/assertion tests — the bulk of the work | 1.5–2d |
| 2 | Builder reconciliation test (reference correctness plan; no new impl) | 0.25d |
| 3 | Private bucket migration + RLS + SQL verify | 0.5d |
| 4 | generate.ts (render/upload/signed-url) + mocked-worker tests | 0.75–1d |
| 5 | Wire 4 routes + from-db mapper + remove pdf-react/jsPDF + list signed URLs | 1–1.5d |
| 6 | Success-card download + regenerate fallback + i18n keys | 0.5d |
| 7 | Resend verification (ops + live test-send; code only if broken) | 0.25–0.5d |
| 8 | Env vars in .env.example + Vercel note | 0.25d |

**Total: ~5–6.5d** (single engineer, sequential). With Tasks 1/3/8 parallelized at the start and 6/7 after 5: ~4–5d wall-clock. **Premium per-project visual polish is OUT OF SCOPE here** (a separate follow-on) — Task 1 ships a solid, correct, page-break-safe base template; the "subir el nivel" creative layer is iterated with mockups for owner review afterward.

## Assumptions & gaps

- **Worker contract assumed:** `POST {COTIZADOR_RENDER_URL}/render` with header `x-render-token: {RENDER_SHARED_SECRET}`, JSON body `{ html, format?, landscape? }`, returns `application/pdf` bytes (or `4xx/5xx` JSON `{error}`). This matches the sibling plan `2026-06-26-cotizador-render-worker.md`. If the worker takes a raw HTML text body instead of JSON, adjust `renderCotizacionPdf`'s `Content-Type`/body (one-line change) — the test in Task 4 Step 1 pins the JSON form; flip both together.
- **Images render as absolute URLs** (the worker fetches them from CDN/Supabase public URLs at render time). If any render/logo lives in a **private** bucket, it must be inlined as a base64 data URI in `build-html.ts` (the cover/plano `<img src>` would become a data URI) — a follow-on if private project assets appear. The current `media` bucket is public, so absolute URLs work today.
- **`colaboradores` role granularity:** the bucket RLS authorizes any active collaborator of the project owner via `is_project_authorized`. If finer per-role (asesor vs director) read scoping is later required, tighten the policy — out of scope here (matches the existing project-wide authorization model).
- **i18n keys** for the new success-card strings (`cotizadorPage.pdfReady`, `cotizadorPage.pdfRetryFailed`) must be added to the locale files the component already consumes; the exact path was not pinned (grep `cotizadorPage.linkCopied` to locate).
- **One-time migration of the 7 existing `cotizaciones` rows** with non-null `pdf_url` (legacy public URLs / dead `uploads` paths) is NOT automated here — per the spec they all have `pdf_url = NULL` in prod and can simply be regenerated. If any real object exists in `media`, move it to the private bucket and delete the public copy (PII) as a manual ops step.
