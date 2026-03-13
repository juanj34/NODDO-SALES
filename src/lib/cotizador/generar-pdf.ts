import jsPDF from "jspdf";
import type { ResultadoCotizacion, CotizadorConfig } from "@/types";

interface PDFData {
  // Project branding
  projectName: string;
  constructoraName: string | null;
  colorPrimario: string;
  // Unit info
  unidadId: string;
  tipologiaName: string | null;
  area: number | null;
  piso: number | null;
  vista: string | null;
  habitaciones: number | null;
  banos: number | null;
  // Quotation
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  // Buyer
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  // Agent
  agenteName: string | null;
  // Meta
  fecha: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function formatCurrency(n: number, moneda: string): string {
  const locale = moneda === "USD" ? "en-US" : moneda === "MXN" ? "es-MX" : "es-CO";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(n);
}

const frecLabels: Record<string, string> = {
  unica: "Pago único",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
};

export function generarPDF(data: PDFData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  const accent = hexToRgb(data.colorPrimario || "#b8973a");
  const accentLight: [number, number, number] = [
    Math.min(255, accent[0] + 40),
    Math.min(255, accent[1] + 40),
    Math.min(255, accent[2] + 20),
  ];
  const moneda = data.config.moneda || "COP";

  // ── Gold accent bar at top ──
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 5, "F");

  // Thin gradient line below
  doc.setFillColor(accentLight[0], accentLight[1], accentLight[2]);
  doc.rect(0, 5, pageW, 0.5, "F");

  let y = 18;

  // ── Header row: Constructora (left) + Date & Agent (right) ──
  doc.setFontSize(9);
  doc.setTextColor(140, 140, 140);
  if (data.constructoraName) {
    doc.text(data.constructoraName.toUpperCase(), margin, y);
  }

  // Right side: date
  doc.text(data.fecha, pageW - margin, y, { align: "right" });

  // Agent name below date (right-aligned)
  if (data.agenteName) {
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(`Asesor: ${data.agenteName}`, pageW - margin, y, { align: "right" });
  }

  y = data.agenteName ? 30 : 28;

  // ── Project name ──
  doc.setFontSize(24);
  doc.setTextColor(25, 25, 25);
  doc.text(data.projectName, margin, y);

  y += 9;

  // ── "COTIZACIÓN" label ──
  doc.setFontSize(10);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("COTIZACIÓN", margin, y);

  y += 6;

  // ── Gold accent divider ──
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.6);
  doc.line(margin, y, margin + 40, y);
  // Lighter continuation
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.2);
  doc.line(margin + 40, y, pageW - margin, y);

  y += 10;

  // ── Client info box ──
  doc.setFillColor(250, 248, 244);
  doc.roundedRect(margin, y - 4, contentW, data.buyerPhone ? 22 : 18, 2, 2, "F");
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y - 4, contentW, data.buyerPhone ? 22 : 18, 2, 2, "S");

  doc.setFontSize(7);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("PREPARADA PARA", margin + 5, y + 1);

  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text(data.buyerName, margin + 5, y + 7);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(data.buyerEmail, margin + 5, y + 12);

  if (data.buyerPhone) {
    doc.text(data.buyerPhone, margin + 5, y + 16.5);
  }

  y += data.buyerPhone ? 24 : 20;

  // ── Unit details ──
  y += 4;
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text(`Unidad ${data.unidadId}`, margin, y);

  y += 7;

  const details: string[] = [];
  if (data.tipologiaName) details.push(data.tipologiaName);
  if (data.area) details.push(`${data.area} m²`);
  if (data.piso !== null && data.piso !== undefined) details.push(`Piso ${data.piso}`);
  if (data.habitaciones) details.push(`${data.habitaciones} hab`);
  if (data.banos) details.push(`${data.banos} baños`);
  if (data.vista) details.push(`Vista: ${data.vista}`);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(details.join("  ·  "), margin, y);

  y += 12;

  // ── Payment breakdown table ──
  doc.setFontSize(9);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("PLAN DE PAGOS", margin, y);

  y += 8;

  // Table header
  const colConcepto = margin + 4;
  const colMonto = margin + contentW * 0.48;
  const colCuotas = margin + contentW * 0.70;
  const colValorCuota = margin + contentW * 0.84;

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(margin, y - 4.5, contentW, 9, 1.5, 1.5, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("CONCEPTO", colConcepto, y);
  doc.text("MONTO", colMonto, y);
  doc.text("CUOTAS", colCuotas, y);
  doc.text("VALOR CUOTA", colValorCuota, y);

  y += 9;

  // Table rows with alternating backgrounds
  data.resultado.fases.forEach((fase, i) => {
    const rowH = 8;

    // Alternating row fill
    if (i % 2 === 0) {
      doc.setFillColor(252, 251, 249);
      doc.rect(margin, y - 5, contentW, rowH, "F");
    }

    doc.setFontSize(9);
    doc.setTextColor(35, 35, 35);
    doc.text(fase.nombre, colConcepto, y);

    doc.setTextColor(50, 50, 50);
    doc.text(formatCurrency(fase.monto_total, moneda), colMonto, y);

    doc.setFontSize(8);
    doc.setTextColor(110, 110, 110);
    const cuotaText = fase.cuotas > 1
      ? `${fase.cuotas}x ${frecLabels[fase.frecuencia] || fase.frecuencia}`
      : frecLabels[fase.frecuencia] || fase.frecuencia;
    doc.text(cuotaText, colCuotas, y);

    if (fase.cuotas > 1) {
      doc.text(formatCurrency(fase.monto_por_cuota, moneda), colValorCuota, y);
    }

    y += rowH;

    // Subtle row divider
    doc.setDrawColor(240, 238, 235);
    doc.setLineWidth(0.15);
    doc.line(margin, y - 3, pageW - margin, y - 3);
  });

  // Discounts
  if (data.resultado.descuentos_aplicados.length > 0) {
    y += 2;
    for (const desc of data.resultado.descuentos_aplicados) {
      doc.setFontSize(9);
      doc.setTextColor(46, 139, 87);
      doc.text(`↓ ${desc.nombre}`, colConcepto, y);
      doc.text(`-${formatCurrency(desc.monto, moneda)}`, colMonto, y);
      y += 7;
    }
  }

  y += 2;

  // ── Total row ──
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(margin, y - 5, contentW, 11, 1.5, 1.5, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", colConcepto, y + 1);
  doc.text(formatCurrency(data.resultado.precio_neto, moneda), colMonto, y + 1);

  y += 18;

  // ── Legal notes ──
  if (data.config.notas_legales) {
    doc.setDrawColor(230, 225, 215);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(155, 155, 155);
    const lines = doc.splitTextToSize(data.config.notas_legales, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 3.5;
  }

  // ── Footer ──
  const footerY = pageH - 14;
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.2);
  doc.line(margin, footerY - 3, pageW - margin, footerY - 3);

  doc.setFontSize(7);
  doc.setTextColor(170, 170, 170);
  doc.text("Generado por NODDO — noddo.io", pageW / 2, footerY, { align: "center" });

  // Gold bar at bottom
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 4, pageW, 4, "F");

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
