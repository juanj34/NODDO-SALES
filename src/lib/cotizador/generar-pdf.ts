import jsPDF from "jspdf";
import type { ResultadoCotizacion, CotizadorConfig, Currency, ComplementoSeleccion } from "@/types";
import { formatCurrency } from "@/lib/currency";

type RGB = [number, number, number];

export interface PDFData {
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
  orientacion: string | null;
  parqueaderos: number | null;
  depositos: number | null;
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
  referenceNumber: string;
  // Cover image (pre-fetched base64)
  coverImageBase64: string | null;
  coverImageFormat: "JPEG" | "PNG" | null;
  // Constructora logo (pre-fetched base64)
  constructoraLogoBase64: string | null;
  constructoraLogoFormat: "JPEG" | "PNG" | null;
  // Additional project data
  tour360Url: string | null;
  whatsappNumero: string | null;
  disclaimer: string | null;
  // Complementos
  complementos?: ComplementoSeleccion[];
  // PDF customization
  pdfSaludo: string | null;
  pdfDespedida: string | null;
  fechaEstimadaEntrega: string | null;
}

/* ── Helpers ── */

function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

const frecLabels: Record<string, string> = {
  unica: "Pago único",
  mensual: "Mensual",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
};

// Dark surface colors matching NODDO brand
const DARK_BG: RGB = [10, 10, 11]; // #0A0A0B
const TEXT_WHITE: RGB = [240, 237, 230]; // warm white
const TEXT_SECONDARY: RGB = [160, 155, 145];
const TEXT_MUTED: RGB = [110, 107, 100];

/* ── Page frame: gold bars top & bottom ── */

function drawPageFrame(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  accent: RGB,
  accentLight: RGB,
) {
  // Top gold bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setFillColor(accentLight[0], accentLight[1], accentLight[2]);
  doc.rect(0, 4, pageW, 0.4, "F");

  // Bottom gold bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 3.5, pageW, 3.5, "F");
}

/* ── Section label: GOLD UPPERCASE with subtle underline ── */

function drawSectionLabel(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  accent: RGB,
  contentW: number,
): number {
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(label, x, y);

  // Gold accent line + subtle continuation
  const labelW = doc.getTextWidth(label) + 4;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + labelW, y + 2);
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.15);
  doc.line(x + labelW, y + 2, x + contentW, y + 2);

  return y + 8;
}

/* ── COVER PAGE (Page 1) ── */

function drawCoverPage(doc: jsPDF, data: PDFData, accent: RGB) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Full dark background
  doc.setFillColor(DARK_BG[0], DARK_BG[1], DARK_BG[2]);
  doc.rect(0, 0, pageW, pageH, "F");

  // Cover image
  if (data.coverImageBase64 && data.coverImageFormat) {
    try {
      const imgW = pageW;
      const maxImgH = pageH * 0.62;

      doc.addImage(
        data.coverImageBase64,
        data.coverImageFormat,
        0,
        0,
        imgW,
        maxImgH,
      );

      // Dark gradient overlay on bottom portion of image (simulate fade to dark)
      const gradientSteps = 24;
      const gradientStartY = maxImgH * 0.45;
      const stepH = (maxImgH - gradientStartY) / gradientSteps;
      for (let i = 0; i < gradientSteps; i++) {
        const progress = i / (gradientSteps - 1);
        const alpha = progress * progress; // ease-in curve
        const r = Math.round(DARK_BG[0] * alpha + (1 - alpha) * 40);
        const g = Math.round(DARK_BG[1] * alpha + (1 - alpha) * 40);
        const b = Math.round(DARK_BG[2] * alpha + (1 - alpha) * 42);
        doc.setFillColor(r, g, b);
        doc.rect(0, gradientStartY + i * stepH, imgW, stepH + 0.5, "F");
      }
    } catch {
      // Image embedding failed — continue with text-only cover
    }
  }

  // Gold accent bar at top
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 3.5, "F");

  // Constructora logo (if available)
  if (data.constructoraLogoBase64 && data.constructoraLogoFormat) {
    try {
      doc.addImage(
        data.constructoraLogoBase64,
        data.constructoraLogoFormat,
        22,
        12,
        30,
        12,
      );
    } catch {
      // Logo embedding failed — show text fallback
    }
  }

  // Content positioned in the lower dark area
  const textStartY = pageH * 0.66;

  // Constructora name
  if (data.constructoraName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
    doc.text(data.constructoraName.toUpperCase(), 22, textStartY);
  }

  // Project name (large)
  const projectNameY = textStartY + (data.constructoraName ? 12 : 0);
  doc.setFontSize(34);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);

  // Wrap project name if too long
  const nameLines = doc.splitTextToSize(data.projectName, pageW - 44);
  doc.text(nameLines, 22, projectNameY);

  const afterNameY = projectNameY + nameLines.length * 13;

  // Gold decorative line
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.8);
  doc.line(22, afterNameY + 3, 72, afterNameY + 3);

  // "COTIZACIÓN" label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("COTIZACIÓN", 22, afterNameY + 12);

  // Reference number
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(TEXT_MUTED[0], TEXT_MUTED[1], TEXT_MUTED[2]);
  doc.text(data.referenceNumber, 22, afterNameY + 19);

  // Date at bottom right
  doc.setFontSize(8);
  doc.setTextColor(TEXT_SECONDARY[0], TEXT_SECONDARY[1], TEXT_SECONDARY[2]);
  doc.text(data.fecha, pageW - 22, pageH - 16, { align: "right" });

  // Unit identifier at bottom left
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(TEXT_WHITE[0], TEXT_WHITE[1], TEXT_WHITE[2]);
  doc.text(`Unidad ${data.unidadId}`, 22, pageH - 16);

  // Bottom gold bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 3.5, pageW, 3.5, "F");
}

/* ── OFFER PAGE (Page 2) ── */

function drawOfferPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  const moneda = (data.config.moneda || "COP") as Currency;

  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  let y = 18;

  // ── Header: Constructora (left) + Date & Agent (right) ──
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  if (data.constructoraName) {
    doc.text(data.constructoraName.toUpperCase(), margin, y);
  }
  doc.text(data.fecha, pageW - margin, y, { align: "right" });

  if (data.agenteName) {
    y += 4.5;
    doc.setFontSize(7.5);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(`Asesor: ${data.agenteName}`, pageW - margin, y, { align: "right" });
  }

  y = 32;

  // ── Title ──
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 25, 25);
  doc.text("Oferta de Compra", margin, y);

  // Reference number
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(data.referenceNumber, pageW - margin, y, { align: "right" });

  y += 5;

  // Gold divider
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, y, margin + 45, y);
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.15);
  doc.line(margin + 45, y, pageW - margin, y);

  y += 8;

  // ── Greeting ──
  const saludo =
    data.pdfSaludo ||
    `Estimado(a) ${data.buyerName}, gracias por considerar ${data.projectName} como su nuevo hogar. A continuación le presentamos la oferta detallada para la unidad seleccionada.`;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  const saludoLines = doc.splitTextToSize(saludo, contentW);
  doc.text(saludoLines, margin, y);
  y += saludoLines.length * 4.2 + 6;

  // ── DETALLE DE LA UNIDAD ──
  y = drawSectionLabel(doc, "DETALLE DE LA UNIDAD", margin, y, accent, contentW);

  // Unit details grid (2-column layout with light background)
  const gridX = margin;
  const gridW = contentW;
  const colW = gridW / 2;
  const cellH = 8.5;

  // Build detail pairs: [label, value][]
  const detailPairs: [string, string][] = [];
  detailPairs.push(["Unidad", data.unidadId]);
  if (data.tipologiaName) detailPairs.push(["Tipología", data.tipologiaName]);
  if (data.area) detailPairs.push(["Área", `${data.area} m²`]);
  if (data.piso !== null && data.piso !== undefined) detailPairs.push(["Piso", `${data.piso}`]);
  if (data.habitaciones) detailPairs.push(["Habitaciones", `${data.habitaciones}`]);
  if (data.banos) detailPairs.push(["Baños", `${data.banos}`]);
  if (data.vista) detailPairs.push(["Vista", data.vista]);
  if (data.orientacion) detailPairs.push(["Orientación", data.orientacion]);
  if (data.parqueaderos) detailPairs.push(["Parqueaderos", `${data.parqueaderos}`]);
  if (data.depositos) detailPairs.push(["Depósitos", `${data.depositos}`]);
  if (data.fechaEstimadaEntrega) detailPairs.push(["Entrega estimada", data.fechaEstimadaEntrega]);

  // Background for the grid
  const rows = Math.ceil(detailPairs.length / 2);
  const gridH = rows * cellH + 4;
  doc.setFillColor(250, 248, 244);
  doc.roundedRect(gridX, y - 2, gridW, gridH, 2, 2, "F");
  doc.setDrawColor(235, 232, 225);
  doc.setLineWidth(0.2);
  doc.roundedRect(gridX, y - 2, gridW, gridH, 2, 2, "S");

  for (let i = 0; i < detailPairs.length; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cellX = gridX + col * colW + 6;
    const cellY = y + row * cellH + 5;

    // Label
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(detailPairs[i][0].toUpperCase(), cellX, cellY);

    // Value
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(detailPairs[i][1], cellX, cellY + 4.5);
  }

  y += gridH + 4;

  // ── Complementos section (if any) ──
  const complementos = data.complementos || data.resultado.complementos;
  if (complementos && complementos.length > 0) {
    y = drawSectionLabel(doc, "COMPLEMENTOS", margin, y, accent, contentW);

    // Separate included vs extras/precio_base for cleaner display
    const includedComps = complementos.filter((c) => !c.es_extra && !c.es_precio_base);
    const extraComps = complementos.filter((c) => c.es_extra || c.es_precio_base);

    for (const comp of [...includedComps, ...extraComps]) {
      const isExtra = comp.es_extra || comp.es_precio_base;
      const label = comp.es_precio_base && comp.cantidad
        ? comp.identificador
        : comp.subtipo
          ? `${comp.identificador} — ${comp.subtipo}`
          : comp.identificador;
      const tipoLabel = comp.tipo === "parqueadero" ? "Parqueadero" : "Depósito";
      const prefix = isExtra ? `${tipoLabel} (adicional)` : tipoLabel;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(35, 35, 35);
      doc.text(`${prefix}: ${label}`, margin + 4, y);

      if (comp.suma_al_total && (comp.precio != null || comp.precio_negociado != null)) {
        doc.setTextColor(accent[0], accent[1], accent[2]);
        doc.text(formatCurrency(comp.precio_negociado ?? comp.precio ?? 0, moneda), pageW - margin - 4, y, { align: "right" });
      } else {
        doc.setFontSize(7.5);
        doc.setTextColor(130, 130, 130);
        doc.text("Incluido", pageW - margin - 4, y, { align: "right" });
      }

      y += 7;
    }

    // Complementos subtotal (if any have pricing)
    const compTotal = data.resultado.complementos_total;
    if (compTotal && compTotal > 0) {
      doc.setDrawColor(230, 225, 215);
      doc.setLineWidth(0.15);
      doc.line(margin + contentW * 0.6, y - 2, pageW - margin, y - 2);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(50, 50, 50);
      doc.text("Subtotal complementos:", margin + contentW * 0.6, y + 3);
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(formatCurrency(compTotal, moneda), pageW - margin - 4, y + 3, { align: "right" });
      y += 10;
    }

    y += 4;
  }

  // ── Total Price (prominent) ──
  const displayTotal = data.resultado.precio_total ?? data.resultado.precio_neto;
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(gridX, y, gridW, 13, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PRECIO TOTAL", gridX + 6, y + 5.5);
  doc.setFontSize(14);
  doc.text(
    formatCurrency(displayTotal, moneda),
    pageW - margin - 6,
    y + 8.5,
    { align: "right" },
  );

  y += 20;

  // ── PLAN DE PAGOS ──
  y = drawSectionLabel(doc, "PLAN DE PAGOS", margin, y, accent, contentW);

  // Table columns
  const colConcepto = margin + 4;
  const colPct = margin + contentW * 0.42;
  const colMonto = margin + contentW * 0.52;
  const colCuotas = margin + contentW * 0.73;
  const colValorCuota = margin + contentW * 0.86;

  // Table header
  doc.setFillColor(35, 35, 38);
  doc.roundedRect(margin, y - 4.5, contentW, 9, 1.5, 1.5, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("CONCEPTO", colConcepto, y);
  doc.text("%", colPct, y);
  doc.text("MONTO", colMonto, y);
  doc.text("CUOTAS", colCuotas, y);
  doc.text("VALOR CUOTA", colValorCuota, y);

  y += 9;

  // Table rows
  data.resultado.fases.forEach((fase, i) => {
    const rowH = 8;

    // Alternating row fill
    if (i % 2 === 0) {
      doc.setFillColor(252, 251, 249);
      doc.rect(margin, y - 5, contentW, rowH, "F");
    }

    // Concepto
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(35, 35, 35);
    doc.text(fase.nombre, colConcepto, y);

    // Percentage
    const totalBase = data.resultado.precio_total ?? data.resultado.precio_neto;
    const pct = totalBase > 0
      ? Math.round((fase.monto_total / totalBase) * 100)
      : 0;
    doc.setFontSize(8);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(`${pct}%`, colPct, y);

    // Monto
    doc.setTextColor(50, 50, 50);
    doc.text(formatCurrency(fase.monto_total, moneda), colMonto, y);

    // Cuotas
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    const cuotaText =
      fase.cuotas > 1
        ? `${fase.cuotas}x ${frecLabels[fase.frecuencia] || fase.frecuencia}`
        : frecLabels[fase.frecuencia] || fase.frecuencia;
    doc.text(cuotaText, colCuotas, y);

    // Valor cuota
    if (fase.cuotas > 1) {
      doc.text(formatCurrency(fase.monto_por_cuota, moneda), colValorCuota, y);
    }

    y += rowH;

    // Row divider
    doc.setDrawColor(240, 238, 235);
    doc.setLineWidth(0.12);
    doc.line(margin, y - 3, pageW - margin, y - 3);
  });

  // Discounts
  if (data.resultado.descuentos_aplicados.length > 0) {
    y += 1;
    for (const desc of data.resultado.descuentos_aplicados) {
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(46, 139, 87);
      doc.text(`↓ ${desc.nombre}`, colConcepto, y);
      doc.text(`-${formatCurrency(desc.monto, moneda)}`, colMonto, y);
      y += 7;
    }
  }

  y += 2;

  // ── Total row ──
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(margin, y - 5, contentW, 10, 1.5, 1.5, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const finalTotal = data.resultado.precio_total ?? data.resultado.precio_neto;
  doc.text("TOTAL", colConcepto, y);
  doc.text("100%", colPct, y);
  doc.text(formatCurrency(finalTotal, moneda), colMonto, y);

  y += 18;

  // ── Sign-off ──
  const despedida = data.pdfDespedida || "Cordialmente,";

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text(despedida, margin, y);
  y += 6;

  if (data.constructoraName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(data.constructoraName, margin, y);
    y += 5;
  }

  if (data.agenteName) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(data.agenteName, margin, y);
  }

  // ── Footer ──
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(170, 170, 170);
  doc.text("Generado por NODDO — noddo.io", pageW / 2, pageH - 8, {
    align: "center",
  });
}

/* ── ADDITIONAL INFO PAGE (Page 3, conditional) ── */

function drawInfoPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;

  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  let y = 22;

  // ── Virtual Tour ──
  if (data.tour360Url) {
    y = drawSectionLabel(doc, "RECORRIDO VIRTUAL", margin, y, accent, contentW);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const tourDesc = `Descubra el interior de su unidad ${data.unidadId} a través de nuestro recorrido virtual interactivo. Haga clic en el siguiente enlace para explorar cada detalle de su futuro hogar.`;
    const tourLines = doc.splitTextToSize(tourDesc, contentW);
    doc.text(tourLines, margin, y);
    y += tourLines.length * 4 + 4;

    // Tour link
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.textWithLink("Ver Recorrido Virtual →", margin, y, {
      url: data.tour360Url,
    });

    y += 16;
  }

  // ── Contact ──
  if (data.whatsappNumero) {
    y = drawSectionLabel(doc, "CONTACTO", margin, y, accent, contentW);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(
      "Escríbanos por WhatsApp para agendar una visita o resolver sus dudas:",
      margin,
      y,
    );
    y += 6;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(data.whatsappNumero, margin, y);

    y += 16;
  }

  // ── Legal disclaimer ──
  const legalParts: string[] = [];
  if (data.disclaimer) legalParts.push(data.disclaimer);
  if (data.config.notas_legales) legalParts.push(data.config.notas_legales);
  const legalText = legalParts.join("\n\n");

  if (legalText) {
    y = drawSectionLabel(doc, "AVISO LEGAL", margin, y, accent, contentW);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    const legalLines = doc.splitTextToSize(legalText, contentW);
    doc.text(legalLines, margin, y);
    y += legalLines.length * 3.5;
  }

  // ── Buyer info recap ──
  y = Math.max(y + 10, pageH * 0.6);
  doc.setDrawColor(230, 225, 215);
  doc.setLineWidth(0.15);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text("PREPARADA PARA", margin, y);
  y += 5;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text(data.buyerName, margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(data.buyerEmail, margin, y);
  if (data.buyerPhone) {
    y += 4;
    doc.text(data.buyerPhone, margin, y);
  }

  // ── Footer ──
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(170, 170, 170);
  doc.text("Generado por NODDO — noddo.io", pageW / 2, pageH - 8, {
    align: "center",
  });
}

/* ── Main export ── */

export function generarPDF(data: PDFData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const accent = hexToRgb(data.colorPrimario || "#b8973a");
  const accentLight: RGB = [
    Math.min(255, accent[0] + 40),
    Math.min(255, accent[1] + 40),
    Math.min(255, accent[2] + 20),
  ];

  // ── Page 1: Cover ──
  drawCoverPage(doc, data, accent);

  // ── Page 2: Offer Details ──
  doc.addPage();
  drawOfferPage(doc, data, accent, accentLight);

  // ── Page 3: Additional Info (conditional) ──
  const hasInfoContent =
    data.tour360Url ||
    data.whatsappNumero ||
    data.disclaimer ||
    data.config.notas_legales;

  if (hasInfoContent) {
    doc.addPage();
    drawInfoPage(doc, data, accent, accentLight);
  }

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
