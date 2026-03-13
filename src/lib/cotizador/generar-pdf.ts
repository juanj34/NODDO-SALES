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

export function generarPDF(data: PDFData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = pageW - margin * 2;
  const accent = hexToRgb(data.colorPrimario || "#b8973a");
  const moneda = data.config.moneda || "COP";

  let y = margin;

  // ── Gold accent bar at top ──
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 4, "F");

  y = 18;

  // ── Header ──
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(data.constructoraName ?? "", margin, y);
  doc.text(data.fecha, pageW - margin, y, { align: "right" });

  y += 10;

  // Project name
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(data.projectName, margin, y);

  y += 8;

  // "COTIZACIÓN" label
  doc.setFontSize(10);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("COTIZACIÓN", margin, y);

  y += 12;

  // ── Divider ──
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  y += 10;

  // ── Unit details ──
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(`Unidad ${data.unidadId}`, margin, y);

  y += 7;

  const details: string[] = [];
  if (data.tipologiaName) details.push(data.tipologiaName);
  if (data.area) details.push(`${data.area} m²`);
  if (data.piso) details.push(`Piso ${data.piso}`);
  if (data.habitaciones) details.push(`${data.habitaciones} hab`);
  if (data.banos) details.push(`${data.banos} baños`);
  if (data.vista) details.push(`Vista: ${data.vista}`);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(details.join("  ·  "), margin, y);

  y += 14;

  // ── Payment breakdown table ──
  doc.setFontSize(10);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("PLAN DE PAGOS", margin, y);

  y += 8;

  // Table header
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y - 4, contentW, 8, "F");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Concepto", margin + 3, y);
  doc.text("Monto", margin + contentW * 0.5, y);
  doc.text("Cuotas", margin + contentW * 0.72, y);
  doc.text("Valor cuota", margin + contentW * 0.85, y);

  y += 8;

  // Table rows
  for (const fase of data.resultado.fases) {
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    doc.text(fase.nombre, margin + 3, y);
    doc.text(formatCurrency(fase.monto_total, moneda), margin + contentW * 0.5, y);
    doc.setTextColor(100, 100, 100);
    doc.text(
      fase.cuotas > 1 ? `${fase.cuotas}x ${fase.frecuencia}` : "1",
      margin + contentW * 0.72, y
    );
    if (fase.cuotas > 1) {
      doc.text(formatCurrency(fase.monto_por_cuota, moneda), margin + contentW * 0.85, y);
    }

    y += 7;

    // Row divider
    doc.setDrawColor(235, 235, 235);
    doc.setLineWidth(0.2);
    doc.line(margin, y - 2, pageW - margin, y - 2);
  }

  // Discounts
  if (data.resultado.descuentos_aplicados.length > 0) {
    y += 3;
    for (const desc of data.resultado.descuentos_aplicados) {
      doc.setFontSize(9);
      doc.setTextColor(34, 139, 34);
      doc.text(`↓ ${desc.nombre}`, margin + 3, y);
      doc.text(`-${formatCurrency(desc.monto, moneda)}`, margin + contentW * 0.5, y);
      y += 7;
    }
  }

  y += 3;

  // Total row
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(margin, y - 4, contentW, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL", margin + 3, y + 1);
  doc.text(formatCurrency(data.resultado.precio_neto, moneda), margin + contentW * 0.5, y + 1);

  y += 18;

  // ── Buyer info ──
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Cotización generada para: ${data.buyerName} (${data.buyerEmail})`, margin, y);

  y += 12;

  // ── Legal notes ──
  if (data.config.notas_legales) {
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 6;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    const lines = doc.splitTextToSize(data.config.notas_legales, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 3.5;
  }

  // ── Footer ──
  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Generado por NODDO — noddo.co", pageW / 2, footerY, { align: "center" });

  // Gold bar at bottom
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, doc.internal.pageSize.getHeight() - 3, pageW, 3, "F");

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
