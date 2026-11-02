import { buildCotizacionHtml } from "./src/lib/cotizador/html/build-html";
import type { CotizacionView, ViewFase, ViewCargo, ViewDescuento } from "./src/lib/cotizador/html/types";
import * as fs from "fs";
import * as path from "path";

const WORKER = "https://noddo-sales-production.up.railway.app";
const SECRET = fs
  .readFileSync("C:/Users/juanj/.claude/secrets/noddo-render-shared-secret.token", "utf8")
  .trim();
const OUT = "C:/Users/juanj/noddo-cotizaciones-prueba";
fs.mkdirSync(OUT, { recursive: true });

// Deterministic local placeholder images as SVG data URIs (synchronous; no
// external host, no flakiness). The plano actually looks like a floor plan.
function svgDataUri(w: number, h: number, bg: string, label: string, fg = "#ffffff"): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="${bg}"/><text x="50%" y="50%" font-family="sans-serif" font-size="${Math.round(h / 11)}" fill="${fg}" fill-opacity="0.5" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function planoSvgDataUri(): string {
  const w = 950, h = 1230;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="100%" height="100%" fill="#f6f5f1"/><g stroke="#2b2b2b" stroke-width="4" fill="none"><rect x="70" y="70" width="810" height="1090"/><line x1="70" y1="540" x2="520" y2="540"/><line x1="520" y1="70" x2="520" y2="1160"/><rect x="130" y="130" width="330" height="330"/><rect x="590" y="130" width="240" height="360"/><rect x="590" y="590" width="240" height="500"/><line x1="130" y1="630" x2="460" y2="630"/></g><text x="50%" y="${h - 34}" font-family="monospace" font-size="32" fill="#777" text-anchor="middle">PLANO · TIPOLOGIA B</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

const COVER = svgDataUri(1200, 760, "#0e1512", "RESERVA DEL BOSQUE", "#b8973a");
const RENDERS = [
  svgDataUri(1280, 800, "#6b7d6e", "RENDER FACHADA"),
  svgDataUri(1280, 800, "#8a7d6b", "RENDER INTERIOR"),
  svgDataUri(1280, 800, "#6b7a8a", "RENDER AMENIDADES"),
  svgDataUri(1280, 800, "#7a6b8a", "RENDER TERRAZA"),
];
const PLANO = planoSvgDataUri();

function monthLabel(i: number): string {
  const d = new Date(2026, 6, 1);
  const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
  return m.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

/** Build N+2 rows: separación + N monthly installments (each its own row) + contra entrega. */
function installmentRows(total: number, n: number, sepPct = 10, entregaPct = 30): ViewFase[] {
  const sep = Math.round((total * sepPct) / 100);
  const entrega = Math.round((total * entregaPct) / 100);
  const per = Math.round((total - sep - entrega) / n);
  const rows: ViewFase[] = [
    { nombre: "Separación", montoTotal: sep, cuotas: 1, montoPorCuota: sep, frecuencia: "unica", fecha: monthLabel(0), porcentaje: sepPct, condicionHito: null },
  ];
  for (let i = 1; i <= n; i++) {
    rows.push({
      nombre: `Cuota ${i}`,
      montoTotal: per,
      cuotas: 1,
      montoPorCuota: per,
      frecuencia: "mensual",
      fecha: monthLabel(i),
      porcentaje: Math.round((per / total) * 1000) / 10,
      condicionHito: null,
    });
  }
  rows.push({ nombre: "Cuota contra entrega", montoTotal: entrega, cuotas: 1, montoPorCuota: entrega, frecuencia: "unica", fecha: null, porcentaje: entregaPct, condicionHito: "A la entrega del inmueble" });
  return rows;
}

function base(): CotizacionView {
  const planTotal = 520_000_000;
  return {
    proyectoNombre: "Reserva del Bosque",
    constructoraNombre: "Constructora Aurora S.A.S.",
    colorPrimario: "#1f6f54",
    logoUrl: null,
    constructoraLogoUrl: null,
    coverUrl: COVER,
    renders: RENDERS.slice(0, 3),
    planoUrl: PLANO,
    ubicacionDireccion: "Calle 7 #45-12, El Poblado, Medellín",
    estadoConstruccion: "en_construccion",
    whatsappNumero: "+57 300 1234567",
    tour360Url: null,
    unidadId: "Apto 1203",
    tipologiaName: "Tipología B — 2 Alcobas",
    areaConstruida: 78.5,
    areaPrivada: 68.2,
    areaLote: null,
    areaM2: 78.5,
    unidadMedida: "m²",
    piso: 12,
    vista: "Vista al bosque",
    habitaciones: 2,
    banos: 2,
    orientacion: "Nororiente",
    parqueaderos: 1,
    depositos: 1,
    features: {},
    moneda: "COP" as CotizacionView["moneda"],
    monedaSecundaria: null,
    tipoCambio: null,
    precioBase: planTotal,
    descuentos: [],
    planTotal,
    cargos: [],
    cargosTotal: 0,
    grandTotal: planTotal,
    complementos: [],
    complementosTotal: 0,
    fases: installmentRows(planTotal, 12),
    paymentPlanNombre: "PLAN 12 CUOTAS",
    agenteNombre: "María Fernanda López",
    agenteTelefono: "+57 311 2223344",
    agenteEmail: "mflopez@aurora.com.co",
    buyerNombre: "Juan David Ramírez",
    buyerEmail: "juandavid.ramirez@gmail.com",
    buyerTelefono: "+57 300 9988776",
    fechaDisplay: "26 jun 2026",
    fechaEstimadaEntrega: "Diciembre 2027",
    referenceNumber: "NOD-2026-0042",
    notasLegales:
      "Esta cotización es informativa y no constituye oferta comercial vinculante. Precios sujetos a cambio sin previo aviso hasta la firma del contrato de promesa de compraventa. Valores expresados en pesos colombianos (COP). La separación no garantiza la reserva de la unidad hasta la suscripción del documento correspondiente.",
    idioma: "es" as CotizacionView["idioma"],
  };
}

function withCargos(v: CotizacionView, cargos: ViewCargo[]): CotizacionView {
  const cargosTotal = cargos.reduce((s, c) => s + c.monto, 0);
  return { ...v, cargos, cargosTotal, grandTotal: v.planTotal + cargosTotal };
}

type Scenario = { id: string; desc: string; view: CotizacionView };

const scenarios: Scenario[] = [];

// S1 — corto: 3 filas (cuotas agrupadas en una fila con sub-línea), 3 renders (caso impar)
{
  const v = base();
  v.fases = [
    { nombre: "Separación", montoTotal: 52_000_000, cuotas: 1, montoPorCuota: 52_000_000, frecuencia: "unica", fecha: monthLabel(0), porcentaje: 10, condicionHito: null },
    { nombre: "Cuotas mensuales", montoTotal: 156_000_000, cuotas: 12, montoPorCuota: 13_000_000, frecuencia: "mensual", fecha: null, porcentaje: 30, condicionHito: "12 cuotas iguales" },
    { nombre: "Cuota contra entrega", montoTotal: 312_000_000, cuotas: 1, montoPorCuota: 312_000_000, frecuencia: "unica", fecha: null, porcentaje: 60, condicionHito: "A la entrega" },
  ];
  v.paymentPlanNombre = "PLAN 12 CUOTAS (AGRUPADO)";
  scenarios.push({ id: "s1-corto-3filas", desc: "Tabla corta, 3 filas, cuotas agrupadas, 3 renders", view: v });
}

// S2 — 12 cuotas expandidas (14 filas), 4 renders (caso par 2x2)
{
  const v = base();
  v.fases = installmentRows(520_000_000, 12);
  v.renders = RENDERS.slice(0, 4);
  scenarios.push({ id: "s2-12cuotas-14filas", desc: "12 cuotas expandidas (14 filas), 4 renders 2x2", view: v });
}

// S3 — 24 cuotas (26 filas), tabla multi-página
{
  const v = base();
  v.fases = installmentRows(520_000_000, 24);
  v.paymentPlanNombre = "PLAN 24 CUOTAS";
  scenarios.push({ id: "s3-24cuotas-26filas", desc: "24 cuotas (26 filas) — tabla a 2+ páginas", view: v });
}

// S4 — 48 cuotas (50 filas)
{
  const v = base();
  v.fases = installmentRows(520_000_000, 48);
  v.paymentPlanNombre = "PLAN 48 CUOTAS";
  scenarios.push({ id: "s4-48cuotas-50filas", desc: "48 cuotas (50 filas) — tabla larga", view: v });
}

// S5 — 72 cuotas (74 filas), estrés extremo
{
  const v = base();
  v.fases = installmentRows(520_000_000, 72);
  v.paymentPlanNombre = "PLAN 72 CUOTAS";
  scenarios.push({ id: "s5-72cuotas-74filas", desc: "72 cuotas (74 filas) — estrés extremo multi-página", view: v });
}

// S6 — USD con COP secundaria (doble moneda, 18 filas) + cargos
{
  let v = base();
  v.moneda = "USD" as CotizacionView["moneda"];
  v.monedaSecundaria = "COP" as CotizacionView["monedaSecundaria"];
  v.tipoCambio = 4050;
  v.planTotal = 130_000;
  v.precioBase = 130_000;
  v.fases = installmentRows(130_000, 16);
  v.paymentPlanNombre = "PAYMENT PLAN (USD)";
  v.notasLegales = "Quote in USD with COP reference at an indicative FX rate. Final settlement in COP at the rate on the payment date.";
  v = withCargos(v, [
    { nombre: "Closing costs", monto: 2_400, tipo: "fijo", porcentaje: null },
    { nombre: "Notary & registration", monto: 1_300, tipo: "porcentaje", porcentaje: 1 },
  ]);
  scenarios.push({ id: "s6-usd-cop-doble-moneda", desc: "USD + COP secundaria, 18 filas, con cargos", view: v });
}

// S7 — Inglés, 14 filas, con cargos + descuentos
{
  let v = base();
  v.idioma = "en" as CotizacionView["idioma"];
  v.fases = installmentRows(520_000_000, 12);
  v.descuentos = [{ nombre: "Early-payment discount", monto: 10_000_000 }] as ViewDescuento[];
  v = withCargos(v, [
    { nombre: "Administration fee", monto: 2_400_000, tipo: "fijo", porcentaje: null },
    { nombre: "Deed & registration", monto: 5_200_000, tipo: "porcentaje", porcentaje: 1 },
  ]);
  v.paymentPlanNombre = "12-MONTH PLAN";
  scenarios.push({ id: "s7-ingles-cargos-descuentos", desc: "Inglés, 14 filas, cargos + descuentos", view: v });
}

// S8 — contenido extremo: nombres largos, muchos cargos/descuentos, notas largas, sin renders ni plano
{
  let v = base();
  v.proyectoNombre = "Conjunto Residencial Altos de la Reserva del Bosque Encantado — Etapa III Premium";
  v.constructoraNombre = "Constructora & Promotora Inmobiliaria Aurora del Valle de Aburrá S.A.S.";
  v.tipologiaName = "Tipología Penthouse Dúplex Esquinero B2 — 3 Alcobas + Estudio + Terraza";
  v.buyerNombre = "María José Fernanda del Carmen Restrepo Echavarría de la Cuesta";
  v.unidadId = "Penthouse PH-2402 Torre Norte";
  v.fases = installmentRows(980_000_000, 6, 15, 35);
  v.planTotal = 980_000_000;
  v.precioBase = 980_000_000;
  v.renders = [];
  v.planoUrl = null;
  v.coverUrl = null;
  v.descuentos = [
    { nombre: "Descuento lanzamiento preventa etapa III", monto: 25_000_000 },
    { nombre: "Bono cliente referido programa Aurora Plus", monto: 8_000_000 },
  ] as ViewDescuento[];
  v = withCargos(v, [
    { nombre: "Cuota de administración anticipada (3 meses)", monto: 3_600_000, tipo: "fijo", porcentaje: null },
    { nombre: "Estudio de crédito y constitución hipoteca", monto: 1_800_000, tipo: "fijo", porcentaje: null },
    { nombre: "Gastos de escrituración y notariales", monto: 9_800_000, tipo: "porcentaje", porcentaje: 1 },
    { nombre: "Seguro de obra y póliza de cumplimiento", monto: 2_450_000, tipo: "fijo", porcentaje: null },
  ]);
  v.notasLegales =
    "El presente documento constituye una cotización de carácter estrictamente informativo y referencial, sin que de él se derive obligación comercial alguna para el promotor o la constructora. Los precios, áreas, acabados y condiciones de pago aquí descritos podrán ser modificados sin previo aviso hasta la suscripción de la promesa de compraventa. Las imágenes y renders son ilustrativos y pueden diferir del producto final entregado. La disponibilidad de la unidad está sujeta a confirmación al momento de la separación efectiva.";
  v.paymentPlanNombre = "PLAN PERSONALIZADO PENTHOUSE";
  scenarios.push({ id: "s8-contenido-extremo", desc: "Nombres/notas largos, 4 cargos, 2 descuentos, sin imágenes", view: v });
}

async function main() {
  const summary: any[] = [];
  for (const sc of scenarios) {
    const html = buildCotizacionHtml(sc.view);
    fs.writeFileSync(path.join(OUT, `${sc.id}.html`), html, "utf8");
    const line: any = { id: sc.id, rows: sc.view.fases.length, desc: sc.desc };
    try {
      const res = await fetch(`${WORKER}/render`, {
        method: "POST",
        headers: { "x-render-token": SECRET, "content-type": "application/json" },
        body: JSON.stringify({ html, format: "Letter" }),
      });
      if (!res.ok) {
        const txt = await res.text();
        line.status = res.status;
        line.error = txt.slice(0, 200);
        console.log(`FAIL ${sc.id} -> ${res.status} ${txt.slice(0, 120)}`);
      } else {
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(path.join(OUT, `${sc.id}.pdf`), buf);
        const isPdf = buf.slice(0, 5).toString("latin1") === "%PDF-";
        line.status = 200;
        line.bytes = buf.length;
        line.isPdf = isPdf;
        console.log(`OK   ${sc.id} -> ${buf.length} bytes, %PDF=${isPdf}, rows=${sc.view.fases.length}`);
      }
    } catch (e: any) {
      line.error = String(e?.message || e);
      console.log(`ERR  ${sc.id} -> ${line.error}`);
    }
    summary.push(line);
  }
  fs.writeFileSync(path.join(OUT, "_summary.json"), JSON.stringify(summary, null, 2));
  console.log("\nOUT:", OUT);
}

main();
