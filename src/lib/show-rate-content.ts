/**
 * Show Rate Optimization — Content Configuration
 *
 * All video URLs, testimonials, and breakout FAQ content used by:
 * - /demo-confirmada thank-you page
 * - Pre-call email sequence (booking-handler)
 *
 * Update these values without touching page/email code.
 */

// ─── Types ──────────────────────────────────────────────────────────────

export interface BreakoutVideo {
  id: string;
  question: string;
  description: string;
  videoUrl: string; // YouTube/Stream embed URL (empty = hidden on page)
  thumbnailUrl: string; // Thumbnail image (empty = generic placeholder)
  durationLabel: string; // e.g. "2:30"
  category: "external" | "internal" | "method";
}

export interface ShowRateTestimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  avatarUrl: string; // empty = initials fallback
  resultMetric?: string; // e.g. "3x más leads"
}

// ─── Pre-Call Video ─────────────────────────────────────────────────────

/** Main 2-minute pre-call video (shown at top of thank-you page + linked in E2) */
export const PRE_CALL_VIDEO = {
  url: "", // TODO: Add YouTube/Stream embed URL when ready
  thumbnailUrl: "",
  title: "Qué esperar en tu demo de NODDO",
  description:
    "En 2 minutos te mostramos cómo funciona la plataforma para que llegues preparado con tus preguntas.",
};

// ─── Breakout Videos (FAQ Objections) ───────────────────────────────────

export const BREAKOUT_VIDEOS: BreakoutVideo[] = [
  {
    id: "no-time",
    question: "No tengo tiempo para implementar otra herramienta",
    description: "Publicar tu primer showroom toma menos de 1 día.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "1:30",
    category: "external",
  },
  {
    id: "have-agency",
    question: "Ya tenemos una agencia que nos maneja el marketing",
    description:
      "NODDO no reemplaza tu agencia — la potencia con un canal de captación directo.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "2:00",
    category: "external",
  },
  {
    id: "not-tech",
    question: "No soy muy tecnológico, ¿mi equipo lo podrá usar?",
    description:
      "Si puedes subir una foto a WhatsApp, puedes usar NODDO. Cero código.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "1:45",
    category: "internal",
  },
  {
    id: "already-have-website",
    question: "Ya tenemos sitio web para el proyecto",
    description:
      "Un showroom digital no es un sitio web. Es una experiencia de venta inmersiva.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "2:15",
    category: "method",
  },
  {
    id: "project-different",
    question: "Mi proyecto es diferente, no sé si aplica",
    description:
      "Funciona para apartamentos, casas, oficinas, lotes — cualquier activo inmobiliario.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "1:30",
    category: "external",
  },
  {
    id: "why-not-wix",
    question: "¿Por qué no usar Wix o un sitio genérico?",
    description:
      "NODDO está diseñado para vender inmuebles — fachadas interactivas, inventario en vivo, leads calificados.",
    videoUrl: "",
    thumbnailUrl: "",
    durationLabel: "2:00",
    category: "method",
  },
];

// ─── Testimonials (Post-Booking, Results-Focused) ───────────────────────

export const SHOW_RATE_TESTIMONIALS: ShowRateTestimonial[] = [
  {
    quote:
      "En la primera semana recibimos más leads cualificados que en los últimos 3 meses con nuestro sitio anterior.",
    name: "Carlos Mendoza",
    role: "Director Comercial",
    company: "Constructora Habitat",
    avatarUrl: "",
    resultMetric: "10x más leads",
  },
  {
    quote:
      "La fachada interactiva cerró la brecha entre sala de ventas física y digital. Nuestros compradores la aman.",
    name: "María Fernanda Ríos",
    role: "Gerente de Proyecto",
    company: "Grupo Inmobiliario Altus",
    avatarUrl: "",
    resultMetric: "40% más conversión",
  },
  {
    quote:
      "Lo publicamos en un día. Sin agencia, sin reuniones interminables. Simplemente funciona.",
    name: "Andrés Velásquez",
    role: "CEO",
    company: "AV Desarrollos",
    avatarUrl: "",
    resultMetric: "1 día al aire",
  },
];

// ─── Thank-You Page Config ──────────────────────────────────────────────

export const THANK_YOU_PAGE_URL = "/demo-confirmada";
export const NODDO_CALENDAR_NAME = "Demo NODDO";
export const DEMO_DURATION_MINUTES = 30;
