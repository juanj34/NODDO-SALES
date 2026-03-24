import jsPDF from "jspdf";
import type { ResultadoCotizacion, CotizadorConfig, Currency, ComplementoSeleccion } from "@/types";
import { formatCurrency } from "@/lib/currency";
import type { EmailLocale } from "@/lib/email-i18n";
import { registerFonts, FONT } from "./pdf-fonts";

type RGB = [number, number, number];

export interface PDFData {
  // Project branding
  projectName: string;
  constructoraName: string | null;
  colorPrimario: string;
  // Unit info
  unidadId: string;
  tipologiaName: string | null;
  area_construida: number | null;
  area_privada: number | null;
  area_lote: number | null;
  area_m2: number | null;
  unidad_medida: string;
  piso: number | null;
  vista: string | null;
  habitaciones: number | null;
  banos: number | null;
  orientacion: string | null;
  parqueaderos: number | null;
  depositos: number | null;
  tiene_jacuzzi?: boolean;
  tiene_piscina?: boolean;
  tiene_bbq?: boolean;
  tiene_terraza?: boolean;
  tiene_jardin?: boolean;
  tiene_cuarto_servicio?: boolean;
  tiene_estudio?: boolean;
  tiene_chimenea?: boolean;
  tiene_doble_altura?: boolean;
  tiene_rooftop?: boolean;
  // Quotation
  resultado: ResultadoCotizacion;
  config: CotizadorConfig;
  // Buyer
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string | null;
  // Agent
  agenteName: string | null;
  agentePhone?: string | null;
  agenteEmail?: string | null;
  // Meta
  fecha: string;
  referenceNumber: string;
  // Cover image (pre-fetched base64)
  coverImageBase64: string | null;
  coverImageFormat: "JPEG" | "PNG" | null;
  // Constructora logo (pre-fetched base64)
  constructoraLogoBase64: string | null;
  constructoraLogoFormat: "JPEG" | "PNG" | null;
  // Project logo (pre-fetched base64)
  projectLogoBase64?: string | null;
  projectLogoFormat?: "JPEG" | "PNG" | null;
  // Floor plan image (pre-fetched base64)
  planoBase64?: string | null;
  planoFormat?: "JPEG" | "PNG" | null;
  planoWidth?: number | null;
  planoHeight?: number | null;
  // Key plan / building position image (pre-fetched base64)
  keyPlanBase64?: string | null;
  keyPlanFormat?: "JPEG" | "PNG" | null;
  keyPlanWidth?: number | null;
  keyPlanHeight?: number | null;
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
  // Style
  coverStyle?: "hero" | "minimalista";
  pdfTheme?: "dark" | "neutral";
  pisoLabel?: string | null;
  // Locale
  idioma?: EmailLocale;
  // Payment plan header
  paymentPlanNombre?: string | null;
  // Admin fee
  adminFee?: number | null;
  adminFeeLabel?: string | null;
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

const frecLabels: Record<EmailLocale, Record<string, string>> = {
  es: { unica: "Pago único", mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral" },
  en: { unica: "One-time", mensual: "Monthly", bimestral: "Bimonthly", trimestral: "Quarterly" },
};

/* ── Theme system ── */

interface ThemePalette {
  bg: RGB;
  text: RGB;
  textSecondary: RGB;
  textMuted: RGB;
  gridBg: RGB;
  gridBorder: RGB;
  rowAlt: RGB;
  tableHeader: RGB;
  tableHeaderText: RGB;
  divider: RGB;
  footerText: RGB;
  // Cover-specific (dark theme only)
  coverBg: RGB;
  coverText: RGB;
  coverTextSecondary: RGB;
  coverTextMuted: RGB;
}

const THEME_DARK: ThemePalette = {
  bg: [255, 255, 255],
  text: [25, 25, 25],
  textSecondary: [80, 80, 80],
  textMuted: [130, 130, 130],
  gridBg: [250, 248, 244],
  gridBorder: [235, 232, 225],
  rowAlt: [252, 251, 249],
  tableHeader: [35, 35, 38],
  tableHeaderText: [255, 255, 255],
  divider: [230, 225, 215],
  footerText: [170, 170, 170],
  coverBg: [10, 10, 11],
  coverText: [240, 237, 230],
  coverTextSecondary: [160, 155, 145],
  coverTextMuted: [110, 107, 100],
};

const THEME_NEUTRAL: ThemePalette = {
  bg: [255, 255, 255],
  text: [30, 30, 30],
  textSecondary: [80, 80, 80],
  textMuted: [140, 140, 140],
  gridBg: [248, 247, 245],
  gridBorder: [230, 228, 224],
  rowAlt: [250, 249, 247],
  tableHeader: [245, 243, 240],
  tableHeaderText: [40, 40, 40],
  divider: [225, 222, 218],
  footerText: [160, 160, 160],
  coverBg: [255, 255, 255],
  coverText: [30, 30, 30],
  coverTextSecondary: [100, 100, 100],
  coverTextMuted: [150, 150, 150],
};

/* ── PDF i18n ── */

interface PDFStrings {
  quotation: string;
  purchaseOffer: string;
  advisor: string;
  unitDetail: string;
  unit: string;
  typology: string;
  area: string;
  area_construida: string;
  area_privada: string;
  area_lote: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  view: string;
  orientation: string;
  parking: string;
  storage: string;
  jacuzzi: string;
  pool: string;
  bbq: string;
  terrace: string;
  garden: string;
  maidsRoom: string;
  study: string;
  fireplace: string;
  doubleHeight: string;
  rooftop: string;
  yes: string;
  estimatedDelivery: string;
  complements: string;
  parking_label: string;
  storage_label: string;
  addon_label: string;
  additional: string;
  included: string;
  complementsSubtotal: string;
  totalPrice: string;
  paymentPlan: string;
  concept: string;
  amount: string;
  installments: string;
  installmentValue: string;
  total: string;
  date: string;
  courtesy: string;
  defaultGreeting: string;
  defaultClosing: string;
  virtualTour: string;
  virtualTourDesc: string;
  viewTour: string;
  contact: string;
  contactDesc: string;
  legalNotice: string;
  preparedFor: string;
  generatedBy: string;
  floorPlan: string;
  floorPlanDisclaimer: string;
  keyPlan: string;
  keyPlanDisclaimer: string;
  nthFloor: string;
}

const PDF_STRINGS: Record<EmailLocale, PDFStrings> = {
  es: {
    quotation: "COTIZACIÓN",
    purchaseOffer: "Oferta de Compra",
    advisor: "Asesor",
    unitDetail: "DETALLE DE LA UNIDAD",
    unit: "Unidad",
    typology: "Tipología",
    area: "Área",
    area_construida: "Área construida",
    area_privada: "Área privada",
    area_lote: "Área lote",
    floor: "Piso",
    bedrooms: "Habitaciones",
    bathrooms: "Baños",
    view: "Vista",
    orientation: "Orientación",
    parking: "Parqueaderos",
    storage: "Depósitos",
    jacuzzi: "Jacuzzi",
    pool: "Piscina",
    bbq: "BBQ privado",
    terrace: "Terraza privada",
    garden: "Jardín privado",
    maidsRoom: "Cuarto de servicio",
    study: "Estudio",
    fireplace: "Chimenea",
    doubleHeight: "Doble altura",
    rooftop: "Rooftop privado",
    yes: "Sí",
    estimatedDelivery: "Entrega estimada",
    complements: "COMPLEMENTOS",
    parking_label: "Parqueadero",
    storage_label: "Depósito",
    addon_label: "Adicional",
    additional: "adicional",
    included: "Incluido",
    complementsSubtotal: "Subtotal complementos:",
    totalPrice: "PRECIO TOTAL",
    paymentPlan: "PLAN DE PAGOS",
    concept: "CONCEPTO",
    amount: "MONTO",
    installments: "CUOTAS",
    installmentValue: "VALOR CUOTA",
    total: "TOTAL",
    date: "FECHA",
    courtesy: "Cortesía",
    defaultGreeting: "Estimado(a) {name}, gracias por considerar {project} como su nuevo hogar. A continuación le presentamos la oferta detallada para la unidad seleccionada.",
    defaultClosing: "Cordialmente,",
    virtualTour: "RECORRIDO VIRTUAL",
    virtualTourDesc: "Descubra el interior de su unidad {unit} a través de nuestro recorrido virtual interactivo. Haga clic en el siguiente enlace para explorar cada detalle de su futuro hogar.",
    viewTour: "Ver Recorrido Virtual →",
    contact: "CONTACTO",
    contactDesc: "Escríbanos por WhatsApp para agendar una visita o resolver sus dudas:",
    legalNotice: "AVISO LEGAL",
    preparedFor: "PREPARADA PARA",
    generatedBy: "Generado por NODDO — noddo.io",
    floorPlan: "PLANO DE PLANTA",
    floorPlanDisclaimer: "Las dimensiones y distribución son aproximadas e ilustrativas. Sujetas a cambios sin previo aviso. Consulte planos técnicos oficiales.",
    keyPlan: "UBICACIÓN EN EDIFICIO",
    keyPlanDisclaimer: "La ubicación mostrada es aproximada e ilustrativa. Las dimensiones pueden variar según piso y orientación.",
    nthFloor: "Piso {n}",
  },
  en: {
    quotation: "QUOTATION",
    purchaseOffer: "Purchase Offer",
    advisor: "Advisor",
    unitDetail: "UNIT DETAILS",
    unit: "Unit",
    typology: "Typology",
    area: "Area",
    area_construida: "Built area",
    area_privada: "Private area",
    area_lote: "Lot area",
    floor: "Floor",
    bedrooms: "Bedrooms",
    bathrooms: "Bathrooms",
    view: "View",
    orientation: "Orientation",
    parking: "Parking spaces",
    storage: "Storage units",
    jacuzzi: "Jacuzzi",
    pool: "Pool",
    bbq: "Private BBQ",
    terrace: "Private terrace",
    garden: "Private garden",
    maidsRoom: "Maid's room",
    study: "Study",
    fireplace: "Fireplace",
    doubleHeight: "Double height",
    rooftop: "Private rooftop",
    yes: "Yes",
    estimatedDelivery: "Estimated delivery",
    complements: "ADD-ONS",
    parking_label: "Parking",
    storage_label: "Storage",
    addon_label: "Add-on",
    additional: "additional",
    included: "Included",
    complementsSubtotal: "Add-ons subtotal:",
    totalPrice: "TOTAL PRICE",
    paymentPlan: "PAYMENT PLAN",
    concept: "ITEM",
    amount: "AMOUNT",
    installments: "INSTALLMENTS",
    installmentValue: "PER INSTALLMENT",
    total: "TOTAL",
    date: "DATE",
    courtesy: "Courtesy",
    defaultGreeting: "Dear {name}, thank you for considering {project} as your new home. Below you will find the detailed offer for the selected unit.",
    defaultClosing: "Best regards,",
    virtualTour: "VIRTUAL TOUR",
    virtualTourDesc: "Discover the interior of unit {unit} through our interactive virtual tour. Click the link below to explore every detail of your future home.",
    viewTour: "View Virtual Tour →",
    contact: "CONTACT",
    contactDesc: "Reach out via WhatsApp to schedule a visit or ask any questions:",
    legalNotice: "LEGAL NOTICE",
    preparedFor: "PREPARED FOR",
    generatedBy: "Generated by NODDO — noddo.io",
    floorPlan: "FLOOR PLAN",
    floorPlanDisclaimer: "Dimensions and layout are approximate and illustrative. Subject to change without notice. Refer to official technical plans.",
    keyPlan: "KEY PLAN",
    keyPlanDisclaimer: "The location shown is approximate and illustrative. Dimensions may vary by floor and orientation.",
    nthFloor: "Floor {n}",
  },
};

/* ── Page frame: accent bars top & bottom ── */

function drawPageFrame(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  accent: RGB,
  accentLight: RGB,
) {
  // Top accent bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 4, "F");
  doc.setFillColor(accentLight[0], accentLight[1], accentLight[2]);
  doc.rect(0, 4, pageW, 0.4, "F");

  // Bottom accent bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 3.5, pageW, 3.5, "F");
}

/* ── Section label: ACCENT UPPERCASE with subtle underline ── */

function drawSectionLabel(
  doc: jsPDF,
  label: string,
  x: number,
  y: number,
  accent: RGB,
  contentW: number,
  theme: ThemePalette,
): number {
  doc.setFontSize(8.5);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(label, x, y);

  // Accent line + subtle continuation
  const labelW = doc.getTextWidth(label) + 4;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.5);
  doc.line(x, y + 2, x + labelW, y + 2);
  doc.setDrawColor(theme.divider[0], theme.divider[1], theme.divider[2]);
  doc.setLineWidth(0.15);
  doc.line(x + labelW, y + 2, x + contentW, y + 2);

  return y + 8;
}

/* ── Dual-logo header: constructora (left) + project (right) ── */

function drawDualLogoHeader(
  doc: jsPDF,
  data: PDFData,
  accent: RGB,
  theme: ThemePalette,
  pageW: number,
  margin: number,
): number {
  const y = 12;

  // Constructora logo (left)
  if (data.constructoraLogoBase64 && data.constructoraLogoFormat) {
    try {
      doc.addImage(data.constructoraLogoBase64, data.constructoraLogoFormat, margin, y, 25, 10);
    } catch { /* silent */ }
  } else if (data.constructoraName) {
    doc.setFontSize(7.5);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(data.constructoraName.toUpperCase(), margin, y + 6);
  }

  // Project logo (right)
  if (data.projectLogoBase64 && data.projectLogoFormat) {
    try {
      doc.addImage(data.projectLogoBase64, data.projectLogoFormat, pageW - margin - 25, y, 25, 10);
    } catch { /* silent */ }
  } else {
    doc.setFontSize(7.5);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(data.projectName, pageW - margin, y + 6, { align: "right" });
  }

  return y + 14;
}

/* ── Aspect-ratio-correct image placement ── */

function fitImage(
  maxW: number,
  maxH: number,
  imgW: number | null | undefined,
  imgH: number | null | undefined,
): { w: number; h: number } {
  if (!imgW || !imgH || imgW <= 0 || imgH <= 0) {
    // Unknown dimensions — use max area with 4:3 fallback ratio
    const aspect = 4 / 3;
    let w = maxW;
    let h = w / aspect;
    if (h > maxH) {
      h = maxH;
      w = h * aspect;
    }
    return { w, h };
  }
  const scale = Math.min(maxW / imgW, maxH / imgH);
  return { w: imgW * scale, h: imgH * scale };
}

/* ── COVER: HERO (dark, with photo) ── */

function drawCoverHero(doc: jsPDF, data: PDFData, accent: RGB, strings: PDFStrings) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const coverBg: RGB = [10, 10, 11];
  const coverText: RGB = [240, 237, 230];
  const coverSecondary: RGB = [160, 155, 145];
  const coverMuted: RGB = [110, 107, 100];

  // Full dark background (fallback if no image)
  doc.setFillColor(coverBg[0], coverBg[1], coverBg[2]);
  doc.rect(0, 0, pageW, pageH, "F");

  // Cover image — FULL PAGE bleed
  if (data.coverImageBase64 && data.coverImageFormat) {
    try {
      doc.addImage(data.coverImageBase64, data.coverImageFormat, 0, 0, pageW, pageH);

      // Gradient overlay: transparent at top → dark at bottom
      // Two-phase gradient for natural look:
      // Phase 1 (subtle): light darken from 40% to 55% of page
      // Phase 2 (strong): heavy darken from 55% to 100% of page
      const steps = 32;

      // Phase 1: subtle vignette (40% → 55%)
      const p1Start = pageH * 0.40;
      const p1End = pageH * 0.55;
      const p1StepH = (p1End - p1Start) / 8;
      for (let i = 0; i < 8; i++) {
        const progress = i / 7;
        const alpha = progress * 0.35; // max 35% opacity
        const r = Math.round(coverBg[0] * alpha + (1 - alpha) * 30);
        const g = Math.round(coverBg[1] * alpha + (1 - alpha) * 30);
        const b = Math.round(coverBg[2] * alpha + (1 - alpha) * 32);
        doc.setFillColor(r, g, b);
        doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: alpha }));
        doc.rect(0, p1Start + i * p1StepH, pageW, p1StepH + 0.5, "F");
      }

      // Phase 2: strong darken (55% → 100%)
      const p2Start = pageH * 0.55;
      const p2StepH = (pageH - p2Start) / steps;
      for (let i = 0; i < steps; i++) {
        const progress = i / (steps - 1);
        const alpha = 0.35 + progress * 0.65; // 35% → 100% opacity
        doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: alpha }));
        doc.setFillColor(coverBg[0], coverBg[1], coverBg[2]);
        doc.rect(0, p2Start + i * p2StepH, pageW, p2StepH + 0.5, "F");
      }

      // Reset opacity
      doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 1 }));
    } catch {
      // Image embedding failed
    }
  }

  // Top accent bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 3.5, "F");

  // Constructora logo — subtle light pill for visibility on photo bg
  if (data.constructoraLogoBase64 && data.constructoraLogoFormat) {
    try {
      doc.setFillColor(255, 255, 255);
      doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 0.15 }));
      doc.roundedRect(18, 8, 38, 20, 3, 3, "F");
      doc.setGState(new (doc as unknown as { GState: new (opts: { opacity: number }) => unknown }).GState({ opacity: 1 }));
      doc.addImage(data.constructoraLogoBase64, data.constructoraLogoFormat, 22, 12, 30, 12);
    } catch { /* silent */ }
  }

  // Content in lower gradient area (text over darkened image)
  const textStartY = pageH * 0.68;

  if (data.constructoraName) {
    doc.setFontSize(9);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(coverSecondary[0], coverSecondary[1], coverSecondary[2]);
    doc.text(data.constructoraName.toUpperCase(), 22, textStartY);
  }

  const projectNameY = textStartY + (data.constructoraName ? 12 : 0);
  doc.setFontSize(38);
  doc.setFont(FONT.HEADING, "normal");
  doc.setTextColor(coverText[0], coverText[1], coverText[2]);
  const nameLines = doc.splitTextToSize(data.projectName, pageW - 44);
  doc.text(nameLines, 22, projectNameY);

  const afterNameY = projectNameY + nameLines.length * 14;

  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.8);
  doc.line(22, afterNameY + 3, 72, afterNameY + 3);

  doc.setFontSize(10);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(strings.quotation, 22, afterNameY + 12);

  doc.setFontSize(8);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(coverMuted[0], coverMuted[1], coverMuted[2]);
  doc.text(data.referenceNumber, 22, afterNameY + 19);

  doc.setFontSize(8);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(coverSecondary[0], coverSecondary[1], coverSecondary[2]);
  doc.text(data.fecha, pageW - 22, pageH - 16, { align: "right" });

  doc.setFontSize(9);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(coverText[0], coverText[1], coverText[2]);
  doc.text(`${strings.unit} ${data.unidadId}`, 22, pageH - 16);

  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 3.5, pageW, 3.5, "F");
}

/* ── COVER: MINIMALIST (clean, white/cream) ── */

function drawCoverMinimalista(doc: jsPDF, data: PDFData, accent: RGB, theme: ThemePalette, strings: PDFStrings) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(theme.coverBg[0], theme.coverBg[1], theme.coverBg[2]);
  doc.rect(0, 0, pageW, pageH, "F");

  // Top accent bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, 0, pageW, 3.5, "F");

  const centerX = pageW / 2;

  // Project logo (centered, large)
  let logoEndY = pageH * 0.32;
  if (data.projectLogoBase64 && data.projectLogoFormat) {
    try {
      const logoMaxW = 60;
      const logoMaxH = 25;
      const logoX = centerX - logoMaxW / 2;
      const logoY = pageH * 0.25;
      doc.addImage(data.projectLogoBase64, data.projectLogoFormat, logoX, logoY, logoMaxW, logoMaxH);
      logoEndY = logoY + logoMaxH + 8;
    } catch { /* silent */ }
  }

  // Project name (large, centered)
  doc.setFontSize(30);
  doc.setFont(FONT.HEADING, "normal");
  doc.setTextColor(theme.coverText[0], theme.coverText[1], theme.coverText[2]);
  const nameLines = doc.splitTextToSize(data.projectName, pageW - 60);
  const nameY = logoEndY + 10;
  doc.text(nameLines, centerX, nameY, { align: "center" });

  const afterNameY = nameY + nameLines.length * 12;

  // Accent line
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.8);
  doc.line(centerX - 25, afterNameY + 4, centerX + 25, afterNameY + 4);

  // "COTIZACIÓN" label
  doc.setFontSize(10);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(strings.quotation, centerX, afterNameY + 14, { align: "center" });

  // Reference number
  doc.setFontSize(8);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.coverTextMuted[0], theme.coverTextMuted[1], theme.coverTextMuted[2]);
  doc.text(data.referenceNumber, centerX, afterNameY + 21, { align: "center" });

  // Unit
  doc.setFontSize(9);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(theme.coverTextSecondary[0], theme.coverTextSecondary[1], theme.coverTextSecondary[2]);
  doc.text(`${strings.unit} ${data.unidadId}`, centerX, afterNameY + 30, { align: "center" });

  // Constructora logo (bottom center)
  const bottomY = pageH - 30;
  if (data.constructoraLogoBase64 && data.constructoraLogoFormat) {
    try {
      doc.addImage(data.constructoraLogoBase64, data.constructoraLogoFormat, centerX - 15, bottomY, 30, 12);
    } catch { /* silent */ }
  } else if (data.constructoraName) {
    doc.setFontSize(9);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(theme.coverTextSecondary[0], theme.coverTextSecondary[1], theme.coverTextSecondary[2]);
    doc.text(data.constructoraName.toUpperCase(), centerX, bottomY + 6, { align: "center" });
  }

  // Date
  doc.setFontSize(7);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.coverTextMuted[0], theme.coverTextMuted[1], theme.coverTextMuted[2]);
  doc.text(data.fecha, centerX, pageH - 12, { align: "center" });

  // Bottom accent bar
  doc.setFillColor(accent[0], accent[1], accent[2]);
  doc.rect(0, pageH - 3.5, pageW, 3.5, "F");
}

/* ── OFFER PAGE (Page 2) ── */

function drawOfferPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB, theme: ThemePalette, strings: PDFStrings, locale: EmailLocale) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;
  const moneda = (data.config.moneda || "COP") as Currency;

  // Background
  doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
  doc.rect(0, 0, pageW, pageH, "F");
  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  // ── Dual-logo header ──
  let y = drawDualLogoHeader(doc, data, accent, theme, pageW, margin);
  y += 6;

  // ── SALES OFFER title block (bordered rectangle) ──
  const titleText = locale === "en" ? "SALES OFFER" : "OFERTA DE VENTA";
  const titleBlockH = 18;
  doc.setFillColor(theme.gridBg[0], theme.gridBg[1], theme.gridBg[2]);
  doc.roundedRect(margin, y, contentW, titleBlockH, 2, 2, "F");
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentW, titleBlockH, 2, 2, "S");

  doc.setFontSize(16);
  doc.setFont(FONT.HEADING, "normal");
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  doc.text(titleText, pageW / 2, y + 8, { align: "center" });

  // Unit subtitle
  const u = data.unidad_medida || "m²";
  const areaDisplay = data.area_m2 ? ` / ${data.area_m2} ${u}` : "";
  doc.setFontSize(8.5);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
  doc.text(`${strings.unit} No: ${data.unidadId}${areaDisplay}`, pageW / 2, y + 14, { align: "center" });

  y += titleBlockH + 6;

  // ── Reference No + Date ──
  doc.setFontSize(7.5);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
  doc.text(`Reference No: ${data.referenceNumber}`, margin, y);
  doc.text(`Date: ${data.fecha}`, pageW - margin, y, { align: "right" });

  y += 3;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;

  // ── PROJECT DETAILS ──
  const pDetailsLabel = locale === "en" ? "PROJECTS DETAILS" : "DETALLES DEL PROYECTO";
  y = drawSectionLabel(doc, pDetailsLabel, margin, y, accent, contentW, theme);

  const gridX = margin;
  const gridW = contentW;
  const colW = gridW / 2;
  const cellH = 11;

  // Project info grid (2 columns)
  const projPairs: [string, string][] = [
    [locale === "en" ? "Project Name:" : "Proyecto:", `${data.projectName}${data.constructoraName ? ` by ${data.constructoraName}` : ""}`],
    [locale === "en" ? "Location:" : "Ubicación:", data.config.fecha_estimada_entrega ? "—" : "—"],
  ];
  projPairs.push([locale === "en" ? "Project Status:" : "Estado:", "Off-Plan"]);
  if (data.fechaEstimadaEntrega) {
    projPairs[1] = [locale === "en" ? "Estimated Completion Date:" : "Fecha estimada de entrega:", data.fechaEstimadaEntrega];
  }

  const projRows = Math.ceil(projPairs.length / 2);
  const projGridH = projRows * cellH + 4;
  doc.setFillColor(theme.gridBg[0], theme.gridBg[1], theme.gridBg[2]);
  doc.roundedRect(gridX, y - 2, gridW, projGridH, 2, 2, "F");
  doc.setDrawColor(theme.gridBorder[0], theme.gridBorder[1], theme.gridBorder[2]);
  doc.setLineWidth(0.15);
  doc.roundedRect(gridX, y - 2, gridW, projGridH, 2, 2, "S");

  for (let i = 0; i < projPairs.length; i++) {
    const row = Math.floor(i / 2);
    const col = i % 2;
    const cellX = gridX + col * colW + 6;
    const cellY = y + row * cellH + 5;

    doc.setFontSize(6.5);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(projPairs[i][0], cellX, cellY);

    doc.setFontSize(9);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(projPairs[i][1], cellX + colW - 12, cellY, { align: "right" });
  }

  y += projGridH + 3;

  // ── PROPERTY DETAILS & SIZING DETAILS ──
  const propLabel = locale === "en" ? "PROPERTY DETAILS & SIZING DETAILS" : "DETALLES DE LA PROPIEDAD";
  y = drawSectionLabel(doc, propLabel, margin, y, accent, contentW, theme);

  // Build left and right columns
  const leftPairs: [string, string][] = [];
  if (data.tipologiaName) leftPairs.push([locale === "en" ? "Unit Type:" : "Tipología:", data.tipologiaName]);
  leftPairs.push([locale === "en" ? "Unit No:" : "Unidad:", data.unidadId]);
  if (data.piso !== null && data.piso !== undefined) leftPairs.push([strings.floor + ":", `${data.piso}`]);
  if (data.parqueaderos) leftPairs.push([locale === "en" ? "No. of Parking:" : "Parqueaderos:", `${data.parqueaderos}`]);
  if (data.tiene_jacuzzi || data.tiene_piscina) {
    leftPairs.push(["Pool / Jacuzzi:", data.tiene_jacuzzi && data.tiene_piscina ? strings.yes : data.tiene_jacuzzi ? "Jacuzzi" : "Pool"]);
  }

  const rightPairs: [string, string][] = [];
  if (data.area_construida) rightPairs.push([strings.area_construida + ":", `${data.area_construida} ${u}`]);
  if (data.area_privada) rightPairs.push([strings.area_privada + ":", `${data.area_privada} ${u}`]);
  if (data.area_m2 && !data.area_construida) rightPairs.push([strings.area + ":", `${data.area_m2} ${u}`]);
  if (data.habitaciones) rightPairs.push([strings.bedrooms + ":", `${data.habitaciones}`]);
  if (data.banos) rightPairs.push([strings.bathrooms + ":", `${data.banos}`]);
  if (data.vista) rightPairs.push([locale === "en" ? "Unit View:" : "Vista:", data.vista]);
  if (data.orientacion) rightPairs.push([strings.orientation + ":", data.orientacion]);

  const propRowCount = Math.max(leftPairs.length, rightPairs.length);
  const propGridH = propRowCount * cellH + 4;
  doc.setFillColor(theme.gridBg[0], theme.gridBg[1], theme.gridBg[2]);
  doc.roundedRect(gridX, y - 2, gridW, propGridH, 2, 2, "F");
  doc.setDrawColor(theme.gridBorder[0], theme.gridBorder[1], theme.gridBorder[2]);
  doc.setLineWidth(0.15);
  doc.roundedRect(gridX, y - 2, gridW, propGridH, 2, 2, "S");
  // Vertical divider
  doc.line(gridX + colW, y - 2, gridX + colW, y - 2 + propGridH);

  // Draw left column
  for (let i = 0; i < leftPairs.length; i++) {
    const cellX = gridX + 6;
    const cellY = y + i * cellH + 5;
    doc.setFontSize(7);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(leftPairs[i][0], cellX, cellY);
    doc.setFontSize(9);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(leftPairs[i][1], gridX + colW - 6, cellY, { align: "right" });

    if (i < leftPairs.length - 1) {
      doc.setDrawColor(theme.gridBorder[0], theme.gridBorder[1], theme.gridBorder[2]);
      doc.setLineWidth(0.1);
      doc.line(gridX + 4, cellY + 4, gridX + colW - 4, cellY + 4);
    }
  }

  // Draw right column
  for (let i = 0; i < rightPairs.length; i++) {
    const cellX = gridX + colW + 6;
    const cellY = y + i * cellH + 5;
    doc.setFontSize(7);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    doc.text(rightPairs[i][0], cellX, cellY);
    doc.setFontSize(9);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(rightPairs[i][1], pageW - margin - 6, cellY, { align: "right" });

    if (i < rightPairs.length - 1) {
      doc.setDrawColor(theme.gridBorder[0], theme.gridBorder[1], theme.gridBorder[2]);
      doc.setLineWidth(0.1);
      doc.line(gridX + colW + 4, cellY + 4, pageW - margin - 4, cellY + 4);
    }
  }

  y += propGridH + 5;

  // ── PAYMENT PLAN ──
  const planName = data.paymentPlanNombre || (locale === "en" ? "Payment Plan" : "Plan de Pagos");
  y = drawSectionLabel(doc, planName, margin, y, accent, contentW, theme);

  // Selling Price + Admin Fee header bar
  const displayTotal = data.resultado.precio_total ?? data.resultado.precio_neto;
  const adminFee = data.adminFee ?? data.resultado.admin_fee ?? 0;
  const adminLabel = data.adminFeeLabel ?? data.resultado.admin_fee_label ?? "Admin Fee";

  doc.setFillColor(theme.gridBg[0], theme.gridBg[1], theme.gridBg[2]);
  doc.roundedRect(margin, y - 3, contentW, 10, 1.5, 1.5, "F");
  doc.setDrawColor(theme.gridBorder[0], theme.gridBorder[1], theme.gridBorder[2]);
  doc.setLineWidth(0.15);
  doc.roundedRect(margin, y - 3, contentW, 10, 1.5, 1.5, "S");

  doc.setFontSize(8);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  const priceLabel = locale === "en" ? "Selling Price:" : "Precio de venta:";
  doc.text(`${priceLabel} ${formatCurrency(displayTotal, moneda)}`, margin + 6, y + 2.5);

  if (adminFee > 0) {
    doc.text(`${adminLabel}: ${formatCurrency(adminFee, moneda)}`, gridX + colW + 6, y + 2.5);
  }

  y += 12;

  // ── 4-column payment table (Wynwood format) ──
  const colDesc = margin + 6;
  const colPct = margin + contentW * 0.50;
  const colDate = margin + contentW * 0.62;
  const colAmt = pageW - margin - 6;

  // Table header
  doc.setFillColor(theme.tableHeader[0], theme.tableHeader[1], theme.tableHeader[2]);
  doc.roundedRect(margin, y - 4.5, contentW, 9, 1.5, 1.5, "F");
  doc.setFontSize(7);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(theme.tableHeaderText[0], theme.tableHeaderText[1], theme.tableHeaderText[2]);
  doc.text(locale === "en" ? "Description" : "Descripción", colDesc, y);
  doc.text(locale === "en" ? "Percentage" : "Porcentaje", colPct, y);
  doc.text(locale === "en" ? "Date" : "Fecha", colDate, y);
  doc.text(locale === "en" ? "Amount" : "Monto", colAmt, y, { align: "right" });

  y += 9;

  // Table rows
  data.resultado.fases.forEach((fase, i) => {
    const rowH = 8;

    if (i % 2 === 0) {
      doc.setFillColor(theme.rowAlt[0], theme.rowAlt[1], theme.rowAlt[2]);
      doc.rect(margin, y - 5, contentW, rowH, "F");
    }

    // Circle bullet
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.4);
    doc.circle(margin + 2.5, y - 1.5, 1.2, "S");

    // Description
    doc.setFontSize(8.5);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    let desc = fase.nombre;
    // If first installment includes admin fee, note it
    if (i === 0 && adminFee > 0) {
      const pct = fase.porcentaje ?? Math.round((fase.monto_total / displayTotal) * 100);
      desc = `${fase.nombre} (+${pct}% + ${adminLabel})`;
    }
    doc.text(desc, colDesc, y);

    // Percentage
    const totalBase = data.resultado.precio_total ?? data.resultado.precio_neto;
    const pct = fase.porcentaje ?? (totalBase > 0 ? Math.round((fase.monto_total / totalBase) * 100) : 0);
    doc.setFontSize(8);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(`${pct}%`, colPct, y);

    // Date
    doc.setFontSize(8);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
    doc.text(fase.fecha || "—", colDate, y);

    // Amount (include admin fee on first installment)
    const displayAmt = i === 0 && adminFee > 0 ? fase.monto_total + adminFee : fase.monto_total;
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(formatCurrency(displayAmt, moneda), colAmt, y, { align: "right" });

    y += rowH;

    // Row divider
    doc.setDrawColor(theme.divider[0], theme.divider[1], theme.divider[2]);
    doc.setLineWidth(0.12);
    doc.line(margin, y - 3, pageW - margin, y - 3);

    // Installment subtitle
    if (fase.cuotas > 1) {
      doc.setFontSize(6.5);
      doc.setFont(FONT.BODY, "normal");
      doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
      const fl = frecLabels[locale];
      doc.text(
        `(${fase.cuotas} ${fl[fase.frecuencia] || fase.frecuencia} × ${formatCurrency(fase.monto_por_cuota, moneda)})`,
        colDesc, y - 0.5,
      );
      y += 4;
    }
  });

  // Discounts
  if (data.resultado.descuentos_aplicados.length > 0) {
    y += 1;
    for (const desc of data.resultado.descuentos_aplicados) {
      doc.setFontSize(8.5);
      doc.setFont(FONT.BODY, "normal");
      doc.setTextColor(46, 139, 87);
      doc.text(`↓ ${desc.nombre}`, colDesc, y);
      doc.setFont(FONT.MONO, "normal");
      doc.text(`-${formatCurrency(desc.monto, moneda)}`, colAmt, y, { align: "right" });
      y += 7;
    }
  }

  y += 6;

  // ── Notes / disclaimers ──
  const notes = data.config.notas_legales || data.disclaimer;
  if (notes) {
    doc.setFontSize(6.5);
    doc.setFont(FONT.BODY, "italic");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    const noteLines = doc.splitTextToSize(notes, contentW);
    doc.text(noteLines, pageW / 2, y, { align: "center" });
    y += noteLines.length * 3 + 4;
  }

  // ── Sign-off (compact) ──
  if (y < pageH - 25) {
    const despedida = data.pdfDespedida || strings.defaultClosing;
    doc.setFontSize(9);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
    doc.text(despedida, margin, y);
    y += 5;

    if (data.constructoraName) {
      doc.setFontSize(10);
      doc.setFont(FONT.HEADING, "normal");
      doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
      doc.text(data.constructoraName, margin, y);
      y += 5;
    }
    if (data.agenteName) {
      doc.setFontSize(8);
      doc.setFont(FONT.BODY, "normal");
      doc.setTextColor(accent[0], accent[1], accent[2]);
      doc.text(data.agenteName, margin, y);
    }
  }

  // Footer
  doc.setFontSize(6.5);
  doc.setFont(FONT.BODY, "normal");
  doc.setTextColor(theme.footerText[0], theme.footerText[1], theme.footerText[2]);
  doc.text(strings.generatedBy, pageW / 2, pageH - 8, { align: "center" });
}

/* ── FLOOR PLAN PAGE (conditional) ── */

function drawFloorPlanPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB, theme: ThemePalette, strings: PDFStrings) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;

  // Background
  doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
  doc.rect(0, 0, pageW, pageH, "F");
  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  // Dual-logo header
  let y = drawDualLogoHeader(doc, data, accent, theme, pageW, margin);
  y += 4;

  // Section label
  y = drawSectionLabel(doc, strings.floorPlan, margin, y, accent, contentW, theme);

  // Typology + unit header
  doc.setFontSize(16);
  doc.setFont(FONT.HEADING, "normal");
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  const header = data.tipologiaName
    ? `${data.tipologiaName} — ${strings.unit}: ${data.unidadId}`
    : `${strings.unit}: ${data.unidadId}`;
  doc.text(header, margin, y);
  y += 10;

  // Floor plan image (centered, aspect-ratio-correct)
  if (data.planoBase64 && data.planoFormat) {
    const maxW = contentW;
    const maxH = pageH - y - 25; // Leave room for footer disclaimer
    const { w, h } = fitImage(maxW, maxH, data.planoWidth, data.planoHeight);
    const imgX = margin + (contentW - w) / 2; // Center horizontally
    try {
      doc.addImage(data.planoBase64, data.planoFormat, imgX, y, w, h);
    } catch { /* silent */ }
  }

  // Disclaimer at bottom
  doc.setFontSize(6);
  doc.setFont(FONT.BODY, "normal");
  doc.setTextColor(theme.footerText[0], theme.footerText[1], theme.footerText[2]);
  const disclaimerLines = doc.splitTextToSize(strings.floorPlanDisclaimer, contentW);
  doc.text(disclaimerLines, pageW / 2, pageH - 12, { align: "center" });
}

/* ── KEY PLAN PAGE (conditional) ── */

function drawKeyPlanPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB, theme: ThemePalette, strings: PDFStrings) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;

  // Background
  doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
  doc.rect(0, 0, pageW, pageH, "F");
  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  // Dual-logo header
  let y = drawDualLogoHeader(doc, data, accent, theme, pageW, margin);
  y += 4;

  // Section label
  y = drawSectionLabel(doc, strings.keyPlan, margin, y, accent, contentW, theme);

  // Floor indicator
  if (data.pisoLabel) {
    doc.setFontSize(12);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(data.pisoLabel, margin, y);
    y += 8;
  }

  // Unit identifier
  doc.setFontSize(10);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
  doc.text(`${strings.unit}: ${data.unidadId}`, margin, y);
  y += 10;

  // Key plan image (centered, aspect-ratio-correct)
  if (data.keyPlanBase64 && data.keyPlanFormat) {
    const maxW = contentW;
    const maxH = pageH - y - 25;
    const { w, h } = fitImage(maxW, maxH, data.keyPlanWidth, data.keyPlanHeight);
    const imgX = margin + (contentW - w) / 2;
    try {
      doc.addImage(data.keyPlanBase64, data.keyPlanFormat, imgX, y, w, h);
    } catch { /* silent */ }
  }

  // Disclaimer at bottom
  doc.setFontSize(6);
  doc.setFont(FONT.BODY, "normal");
  doc.setTextColor(theme.footerText[0], theme.footerText[1], theme.footerText[2]);
  const disclaimerLines = doc.splitTextToSize(strings.keyPlanDisclaimer, contentW);
  doc.text(disclaimerLines, pageW / 2, pageH - 12, { align: "center" });
}

/* ── ADDITIONAL INFO PAGE (conditional) ── */

function drawInfoPage(doc: jsPDF, data: PDFData, accent: RGB, accentLight: RGB, theme: ThemePalette, strings: PDFStrings) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentW = pageW - margin * 2;

  // Background
  doc.setFillColor(theme.bg[0], theme.bg[1], theme.bg[2]);
  doc.rect(0, 0, pageW, pageH, "F");
  drawPageFrame(doc, pageW, pageH, accent, accentLight);

  // Dual-logo header
  let y = drawDualLogoHeader(doc, data, accent, theme, pageW, margin);
  y += 4;

  // ── Virtual Tour ──
  if (data.tour360Url) {
    y = drawSectionLabel(doc, strings.virtualTour, margin, y, accent, contentW, theme);

    doc.setFontSize(9);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
    const tourDesc = strings.virtualTourDesc.replace("{unit}", data.unidadId);
    const tourLines = doc.splitTextToSize(tourDesc, contentW);
    doc.text(tourLines, margin, y);
    y += tourLines.length * 4 + 4;

    doc.setFontSize(9);
    doc.setFont(FONT.LABEL, "bold");
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.textWithLink(strings.viewTour, margin, y, { url: data.tour360Url });

    y += 16;
  }

  // ── Contact ──
  if (data.whatsappNumero) {
    y = drawSectionLabel(doc, strings.contact, margin, y, accent, contentW, theme);

    doc.setFontSize(9);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textSecondary[0], theme.textSecondary[1], theme.textSecondary[2]);
    doc.text(strings.contactDesc, margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont(FONT.MONO, "normal");
    doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
    doc.text(data.whatsappNumero, margin, y);

    y += 16;
  }

  // ── Legal disclaimer ──
  const legalParts: string[] = [];
  if (data.disclaimer) legalParts.push(data.disclaimer);
  if (data.config.notas_legales) legalParts.push(data.config.notas_legales);
  const legalText = legalParts.join("\n\n");

  if (legalText) {
    y = drawSectionLabel(doc, strings.legalNotice, margin, y, accent, contentW, theme);

    doc.setFontSize(7.5);
    doc.setFont(FONT.BODY, "normal");
    doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
    const legalLines = doc.splitTextToSize(legalText, contentW);
    doc.text(legalLines, margin, y);
    y += legalLines.length * 3.5;
  }

  // ── Buyer info recap ──
  y = Math.max(y + 10, pageH * 0.6);
  doc.setDrawColor(theme.divider[0], theme.divider[1], theme.divider[2]);
  doc.setLineWidth(0.15);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  doc.setFontSize(7);
  doc.setFont(FONT.LABEL, "bold");
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(strings.preparedFor, margin, y);
  y += 5;

  doc.setFontSize(11);
  doc.setFont(FONT.HEADING, "normal");
  doc.setTextColor(theme.text[0], theme.text[1], theme.text[2]);
  doc.text(data.buyerName, margin, y);
  y += 5;

  doc.setFontSize(8);
  doc.setFont(FONT.MONO, "normal");
  doc.setTextColor(theme.textMuted[0], theme.textMuted[1], theme.textMuted[2]);
  doc.text(data.buyerEmail, margin, y);
  if (data.buyerPhone) {
    y += 4;
    doc.text(data.buyerPhone, margin, y);
  }

  // Footer
  doc.setFontSize(6.5);
  doc.setFont(FONT.BODY, "normal");
  doc.setTextColor(theme.footerText[0], theme.footerText[1], theme.footerText[2]);
  doc.text(strings.generatedBy, pageW / 2, pageH - 8, { align: "center" });
}

/* ── Main export ── */

export function generarPDF(data: PDFData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  registerFonts(doc);
  const accent = hexToRgb(data.colorPrimario || "#b8973a");
  const accentLight: RGB = [
    Math.min(255, accent[0] + 40),
    Math.min(255, accent[1] + 40),
    Math.min(255, accent[2] + 20),
  ];
  const locale: EmailLocale = data.idioma || "es";
  const strings = PDF_STRINGS[locale];
  const theme = data.pdfTheme === "dark" ? THEME_DARK : THEME_NEUTRAL;
  const coverStyle = data.coverStyle || "hero";

  // ── Page 1: Cover ──
  if (coverStyle === "minimalista") {
    drawCoverMinimalista(doc, data, accent, theme, strings);
  } else {
    drawCoverHero(doc, data, accent, strings);
  }

  // ── Page 2: Offer Details ──
  doc.addPage();
  drawOfferPage(doc, data, accent, accentLight, theme, strings, locale);

  // ── Page 3 (conditional): Floor Plan ──
  if (data.planoBase64 && data.planoFormat) {
    doc.addPage();
    drawFloorPlanPage(doc, data, accent, accentLight, theme, strings);
  }

  // ── Page 4 (conditional): Key Plan ──
  if (data.keyPlanBase64 && data.keyPlanFormat) {
    doc.addPage();
    drawKeyPlanPage(doc, data, accent, accentLight, theme, strings);
  }

  // ── Page 5 (conditional): Additional Info ──
  const hasInfoContent =
    data.tour360Url ||
    data.whatsappNumero ||
    data.disclaimer ||
    data.config.notas_legales;

  if (hasInfoContent) {
    doc.addPage();
    drawInfoPage(doc, data, accent, accentLight, theme, strings);
  }

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
