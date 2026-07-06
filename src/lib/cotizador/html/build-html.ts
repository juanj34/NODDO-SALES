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

/** Detects the delivery-calculator's exact 3-fase shape: Separación (fijo) -> Cuota inicial (porcentaje) -> ... */
function fasesMatchCalculatorShape(fases: ViewFase[]): boolean {
  return fases.length >= 2 && fases[0].nombre === "Separación" && fases[1].nombre === "Cuota inicial";
}

/**
 * Grouped rendering for delivery-calculator quotes: Separación + Cuota inicial
 * collapse into one "CUOTA INICIAL (NN%)" header row with two indented
 * sub-rows (the separación amount, then the N-cuotas breakdown), followed by
 * whatever fases remain (Financiación) rendered as normal rows.
 */
function groupedInicialRows(fases: ViewFase[], view: CotizacionView, en: boolean): string {
  const separacion = fases[0];
  const inicial = fases[1];
  const rest = fases.slice(2);

  // Percentages come straight from the existing Hamilton (largest-remainder) pass —
  // summing the two already-rounded fase percentages, never recomputed from money,
  // so the header always reconciles with the two rows it replaces (same idiom as
  // the split-cuotas percentage-rounding fix in calcular.ts).
  const pct = separacion.porcentaje + inicial.porcentaje;
  const amt = separacion.montoTotal + inicial.montoTotal;
  const groupLabel = en ? "INITIAL PAYMENT" : "CUOTA INICIAL";
  const separacionLabel = en ? "Down payment" : "Separación";
  const cuotasText =
    inicial.cuotas > 1
      ? en
        ? `${inicial.cuotas} monthly installments of ${money(inicial.montoPorCuota, view)}`
        : `${inicial.cuotas} cuotas mensuales de ${money(inicial.montoPorCuota, view)}`
      : en
        ? `Single payment of ${money(inicial.montoTotal, view)}`
        : `Pago único de ${money(inicial.montoTotal, view)}`;

  const headerRow =
    `<tr class="prow group-header" data-group-header>` +
    `<td class="c-name">${esc(groupLabel)} (${pct}%)</td>` +
    `<td class="c-pct">${pct}%</td>` +
    `<td class="c-date">—</td>` +
    `<td class="c-amt">${money(amt, view)}</td>` +
    `</tr>`;

  const subSeparacionRow =
    `<tr class="prow sub-row" data-group-sub>` +
    `<td class="c-name sub-indent">${esc(separacionLabel)} · ${money(separacion.montoTotal, view)}</td>` +
    `<td class="c-pct"></td><td class="c-date"></td><td class="c-amt"></td>` +
    `</tr>`;

  const subCuotasRow =
    `<tr class="prow sub-row" data-group-sub>` +
    `<td class="c-name sub-indent">${cuotasText}</td>` +
    `<td class="c-pct"></td><td class="c-date"></td><td class="c-amt"></td>` +
    `</tr>`;

  const restRows = rest.map((f) => faseRow(f, view)).join("");

  return headerRow + subSeparacionRow + subCuotasRow + restRows;
}

/**
 * Renders the payment plan's table rows. Grouped layout only kicks in when the
 * caller explicitly set `agruparInicial` AND the fase shape matches the
 * calculator's output — an explicit flag (never shape-only guessing) that
 * defaults to false, so template-mode quotes render exactly as before.
 */
function planRows(view: CotizacionView, en: boolean): string {
  if (view.agruparInicial && fasesMatchCalculatorShape(view.fases)) {
    return groupedInicialRows(view.fases, view, en);
  }
  return view.fases.map((f) => faseRow(f, view)).join("");
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
    planTotal: en ? "Property value" : "Valor del inmueble",
    additionalCharges: en ? "Additional charges" : "Cargos adicionales",
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
    additionalInfo: en ? "ADDITIONAL INFO" : "INFORMACIÓN ADICIONAL",
    leasing: "Leasing",
    parking: en ? "Parking" : "Parqueadero(s)",
    finishes: en ? "Finishes" : "Acabados",
    bonuses: en ? "Bonuses / discounts" : "Bonos y/o descuentos",
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

  // Summary breakdown: plan total + (cargos itemized) + grand total. Renders the
  // negotiated plan total (precio_negociado) explicitly so it is always visible.
  const summaryRows: string[] = [
    `<div class="srow"><span class="sk">${t.planTotal}</span><span class="sv">${money(view.planTotal, view)}</span></div>`,
  ];
  for (const c of view.cargos) {
    const pct = c.tipo === "porcentaje" && c.porcentaje != null ? ` (${c.porcentaje}%)` : "";
    summaryRows.push(
      `<div class="srow"><span class="sk">${esc(c.nombre)}${pct}</span><span class="sv">${money(c.monto, view)}</span></div>`,
    );
  }

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

  // Excel-parity extras band: only the rows whose config value is non-empty.
  const extraPairs: [string, string][] = [];
  if (view.leasingNota) extraPairs.push([t.leasing, view.leasingNota]);
  if (view.parqueaderosLabel) extraPairs.push([t.parking, view.parqueaderosLabel]);
  if (view.acabadosNota) extraPairs.push([t.finishes, view.acabadosNota]);
  if (view.bonosNota) extraPairs.push([t.bonuses, view.bonosNota]);
  const extrasHtml =
    extraPairs.length > 0
      ? `<div class="section" data-extras><div class="label">${t.additionalInfo}</div><div class="grid">${detailRows(extraPairs)}</div></div>`
      : "";

  // Vigencia: printed above the legal notice, using the quote date already in the view.
  const vigenciaHtml =
    view.vigenciaDias != null
      ? `<div class="vigencia">${
          en
            ? `This quotation is valid for ${view.vigenciaDias} calendar days from its issue date (${esc(view.fechaDisplay)}).`
            : `Esta cotización tiene vigencia de ${view.vigenciaDias} días calendario a partir de su expedición (${esc(view.fechaDisplay)}).`
        }</div>`
      : "";

  const rendersHtml =
    view.renders.length > 0
      ? `<section class="renders"><div class="label">${t.renders}</div>` +
        `<div class="render-stack">` +
        view.renders
          .slice(0, 4)
          .map((r) => `<img class="render" src="${esc(r)}" alt="" />`)
          .join("") +
        `</div></section>`
      : "";

  const planoHtml = view.planoUrl
    ? `<section class="plano"><div class="label">${t.floorPlan}</div>` +
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
h1,.title{font-family:'Inter',system-ui,sans-serif;font-weight:600;letter-spacing:-0.015em;}
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
.summary .srow{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;font-size:9px;color:#6b6b6b;}
.summary .srow .sk{color:#8a8580;}
.summary .srow .sv{font-family:'DM Mono',monospace;color:#1b1b1b;}
.summary .grand{display:flex;justify-content:space-between;align-items:baseline;margin-top:8px;padding-top:8px;border-top:1px solid #e6e2da;}
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
tr.group-header td{background:#f5efe1;font-weight:600;}
tr.group-header .c-name{font-family:'Syne',sans-serif;font-weight:700;font-size:8.5px;letter-spacing:0.4px;color:${accent};}
tr.sub-row td{border-bottom:0.5px solid #ece8e1;}
td.sub-indent{padding-left:18px;color:#6b6b6b;font-family:'DM Mono',monospace;font-size:8.5px;}
tr.total td{font-family:'Syne',sans-serif;font-weight:700;background:${accent};color:#fff;font-size:10px;letter-spacing:0.5px;}
tr.total td.c-amt{font-family:'DM Mono',monospace;}
.renders,.plano{page-break-before:always;}
.renders>.label{margin-bottom:8px;}
.render-stack{display:flex;flex-direction:column;gap:8px;height:232mm;}
.render{flex:1 1 0;min-height:0;width:100%;object-fit:cover;border-radius:6px;}
.plano .label{margin-bottom:6px;}
.plano-head{font-family:'DM Mono',monospace;font-size:9px;color:#6b6b6b;margin:0 0 8px;}
.plano-img{width:100%;height:auto;max-height:224mm;object-fit:contain;display:block;}
.footer-block{margin-top:18px;border-top:0.5px solid #e6e2da;padding-top:12px;page-break-inside:avoid;}
.agent{margin-top:10px;}
.agent-name{font-size:11px;}
.agent-line{font-family:'DM Mono',monospace;font-size:9px;color:#6b6b6b;}
.prepared{margin-top:10px;}
.prepared .name{font-size:11px;}
.prepared .mono{font-size:9px;color:#8a8580;}
.legal{font-size:7.5px;color:#8a8580;margin-top:10px;line-height:1.5;white-space:pre-line;}
.vigencia{font-size:7.5px;color:#8a8580;margin-top:8px;line-height:1.5;}
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
        ${summaryRows.join("")}
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
          ${planRows(view, en)}
          ${descHtml}
          ${cargosHtml}
          <tr class="total"><td colspan="3" class="c-name">${t.total}</td><td class="c-amt">${money(view.grandTotal, view)}</td></tr>
        </tbody>
      </table>
    </div>

    ${extrasHtml}
    ${rendersHtml}
    ${planoHtml}

    <div class="footer-block">
      ${agentCard}
      <div class="prepared">
        <div class="label">${t.preparedFor}</div>
        <div class="name">${esc(view.buyerNombre)}</div>
        <div class="mono">${esc(view.buyerEmail)}${view.buyerTelefono ? " · " + esc(view.buyerTelefono) : ""}</div>
      </div>
      ${vigenciaHtml}
      ${view.notasLegales ? `<div class="legal"><div class="label">${t.legal}</div>${esc(view.notasLegales)}</div>` : ""}
      <div class="page-footer">${t.generatedBy}</div>
    </div>
  </main>
</body>
</html>`;
}
