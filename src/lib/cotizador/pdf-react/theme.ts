/**
 * Theme palettes and i18n strings for React PDF cotizaciones
 */

import type { EmailLocale } from "@/lib/email-i18n";

/* ── Color helpers ── */

export function hexToRgba(hex: string, alpha = 1): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return alpha === 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha})`;
}

export function lightenHex(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const r = Math.min(255, parseInt(h.substring(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(h.substring(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(h.substring(4, 6), 16) + Math.round(amount / 2));
  return `rgb(${r},${g},${b})`;
}

/* ── Theme palettes ── */

export interface ThemePalette {
  bg: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  gridBg: string;
  gridBorder: string;
  rowAlt: string;
  tableHeader: string;
  tableHeaderText: string;
  divider: string;
  footerText: string;
  coverBg: string;
  coverText: string;
  coverTextSecondary: string;
  coverTextMuted: string;
}

export const THEME_DARK: ThemePalette = {
  bg: "rgb(255,255,255)",
  text: "rgb(25,25,25)",
  textSecondary: "rgb(80,80,80)",
  textMuted: "rgb(130,130,130)",
  gridBg: "rgb(250,248,244)",
  gridBorder: "rgb(235,232,225)",
  rowAlt: "rgb(252,251,249)",
  tableHeader: "rgb(35,35,38)",
  tableHeaderText: "rgb(255,255,255)",
  divider: "rgb(230,225,215)",
  footerText: "rgb(170,170,170)",
  coverBg: "rgb(10,10,11)",
  coverText: "rgb(240,237,230)",
  coverTextSecondary: "rgb(160,155,145)",
  coverTextMuted: "rgb(110,107,100)",
};

export const THEME_NEUTRAL: ThemePalette = {
  bg: "rgb(255,255,255)",
  text: "rgb(30,30,30)",
  textSecondary: "rgb(80,80,80)",
  textMuted: "rgb(140,140,140)",
  gridBg: "rgb(248,247,245)",
  gridBorder: "rgb(230,228,224)",
  rowAlt: "rgb(250,249,247)",
  tableHeader: "rgb(245,243,240)",
  tableHeaderText: "rgb(40,40,40)",
  divider: "rgb(225,222,218)",
  footerText: "rgb(160,160,160)",
  coverBg: "rgb(255,255,255)",
  coverText: "rgb(30,30,30)",
  coverTextSecondary: "rgb(100,100,100)",
  coverTextMuted: "rgb(150,150,150)",
};

/* ── i18n strings ── */

export interface PDFStrings {
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
  no: string;
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
  equivalentIn: string;
  condition: string;
  salesOffer: string;
  projectDetails: string;
  propertyDetails: string;
  sellingPrice: string;
  description: string;
  percentage: string;
  furnished: string;
  location: string;
  status: string;
  project: string;
}

export const PDF_STRINGS: Record<EmailLocale, PDFStrings> = {
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
    no: "No",
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
    viewTour: "Ver Recorrido Virtual",
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
    equivalentIn: "Equivalente en",
    condition: "Condición",
    salesOffer: "OFERTA DE VENTA",
    projectDetails: "DETALLES DEL PROYECTO",
    propertyDetails: "DETALLES DE LA PROPIEDAD",
    sellingPrice: "Precio de venta:",
    description: "Descripción",
    percentage: "Porcentaje",
    furnished: "Amoblado",
    location: "Ubicación",
    status: "Estado",
    project: "Proyecto",
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
    no: "No",
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
    viewTour: "View Virtual Tour",
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
    equivalentIn: "Equivalent in",
    condition: "Condition",
    salesOffer: "SALES OFFER",
    projectDetails: "PROJECT DETAILS",
    propertyDetails: "PROPERTY DETAILS",
    sellingPrice: "Selling Price:",
    description: "Description",
    percentage: "Percentage",
    furnished: "Furnished",
    location: "Location",
    status: "Status",
    project: "Project",
  },
};

export const FREQ_LABELS: Record<EmailLocale, Record<string, string>> = {
  es: { unica: "Pago único", mensual: "Mensual", bimestral: "Bimestral", trimestral: "Trimestral" },
  en: { unica: "One-time", mensual: "Monthly", bimestral: "Bimonthly", trimestral: "Quarterly" },
};

export const STATUS_LABELS: Record<string, Record<string, string>> = {
  sobre_planos: { es: "Sobre planos", en: "Off-Plan" },
  en_construccion: { es: "En construcción", en: "Under Construction" },
  entregado: { es: "Entregado", en: "Completed" },
};
