/**
 * Email i18n — All translatable strings for NODDO email templates.
 *
 * Two locale sources:
 *   • Admin-facing emails → user_profiles.locale  (admin's preference)
 *   • Client-facing emails → proyectos.idioma       (project's language)
 */

export type EmailLocale = "es" | "en";

/* ── Shared ─────────────────────────────────────────────────────────── */

interface SharedStrings {
  hello: string;               // "Hola" / "Hello"
  viewLeads: string;           // CTA label
  viewProjects: string;
  questions: string;           // "¿Preguntas? ..." footer line
  footer: {
    company: string;
    privacy: string;
    terms: string;
    unsubscribe: string;
  };
}

/* ── Per-email-type strings ─────────────────────────────────────────── */

interface LeadNotificationStrings {
  subject: string;     // "Nuevo lead en {project} — NODDO"
  heading: string;
  labels: {
    name: string;
    email: string;
    phone: string;
    country: string;
    typology: string;
    message: string;
  };
}

interface LeadConfirmationStrings {
  subject: string;     // "Gracias por tu interés en {project}"
  heading: string;
  body: string;        // "Hemos recibido tu solicitud..."
}

interface CotizacionBuyerStrings {
  subject: string;
  heading: string;
  labels: { unit: string; total: string };
  body: string;        // "Adjunto encontrarás..."
  filename: string;    // "Cotizacion" / "Quote"
  // Branded email defaults & CTA labels
  defaultSaludo: string;
  defaultDespedida: string;
  whatsappCta: string;
  tourCta: string;
  brochureCta: string;
  micrositeCta: string;
}

interface CotizacionAdminStrings {
  subject: string;
  heading: string;
  labels: { client: string; email: string; phone: string; unit: string; total: string };
}

interface WelcomeStrings {
  subject: string;
  heading: string;
  body: string;        // "Tu cuenta está lista con el plan..."
  createProject: string;
  needMore: string;
  viewPlans: string;
  planPrices: Record<string, string>;
}

interface CollaboratorInviteStrings {
  subject: string;     // "{inviter} te invita..."
  heading: string;
  body: string;        // "{inviter} te ha invitado como colaborador..."
  cta: string;
}

interface BookingConfirmationStrings {
  subject: string;
  heading: string;
  body: string;
  labels: { date: string; time: string; duration: string; format: string };
  durationUnit: string;
  formatValue: string; // "Videollamada" / "Video call"
  whatToExpect: string;
  bullets: string[];
  joinCall: string;
  goToNoddo: string;
}

interface BookingAdminStrings {
  subject: string;
  heading: string;
  labels: {
    name: string;
    email: string;
    phone: string;
    company: string;
    date: string;
    time: string;
    source: string;
    campaign: string;
  };
}

interface BookingReminderStrings {
  subject24h: string;
  subject2h: string;
  heading24h: string;
  heading2h: string;
  body24h: string;     // "Solo un recordatorio..."
  body2h: string;      // "Tu demo comienza en 2 horas..."
  joinCall: string;
  goToNoddo: string;
}

interface NoShowStrings {
  subject: string;
  heading: string;
  body: string;
  rescheduleCta: string;
  whatsappNote: string;
}

interface PlanUpgradeStrings {
  subject: string;     // "Bienvenido a {plan} — NODDO"
  heading: string;     // "Bienvenido a {plan}"
  body: string;        // "Tu plan ha sido actualizado..."
  labels: { newPlan: string; maxProjects: string; maxUnits: string };
  unlimited: string;
  unlimitedFem: string; // "Ilimitadas" / "Unlimited"
  featuresUnlocked: string;
  exploreCta: string;
  features: Record<string, string[]>;
}

interface FeatureBlockedStrings {
  subject: string;
  heading: string;     // "Desbloquea {feature}"
  body: string;        // "Intentaste usar..."
  body2: string;       // "Actualiza tu plan..."
  upgradeCta: string;  // "Actualizar a {plan}"
}

/* ── Full locale bundle ─────────────────────────────────────────────── */

export interface EmailStrings {
  shared: SharedStrings;
  leadNotification: LeadNotificationStrings;
  leadConfirmation: LeadConfirmationStrings;
  cotizacionBuyer: CotizacionBuyerStrings;
  cotizacionAdmin: CotizacionAdminStrings;
  welcome: WelcomeStrings;
  collaboratorInvite: CollaboratorInviteStrings;
  bookingConfirmation: BookingConfirmationStrings;
  bookingAdmin: BookingAdminStrings;
  bookingReminder: BookingReminderStrings;
  noShow: NoShowStrings;
  planUpgrade: PlanUpgradeStrings;
  featureBlocked: FeatureBlockedStrings;
}

/* ── Spanish ────────────────────────────────────────────────────────── */

const es: EmailStrings = {
  shared: {
    hello: "Hola",
    viewLeads: "Ver Leads",
    viewProjects: "Explorar mis proyectos",
    questions: '¿Preguntas? Escríbenos a <a href="mailto:hola@noddo.io" style="color:#b8973a;text-decoration:underline;">hola@noddo.io</a>',
    footer: {
      company: "Noddo Technologies SAS · Bogotá, Colombia",
      privacy: "Privacidad",
      terms: "Términos",
      unsubscribe: "Cancelar suscripción",
    },
  },

  leadNotification: {
    subject: "Nuevo lead en {project} — NODDO",
    heading: "Nuevo lead recibido",
    labels: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      country: "País",
      typology: "Tipología de interés",
      message: "Mensaje",
    },
  },

  leadConfirmation: {
    subject: "Gracias por tu interés en {project}",
    heading: "Gracias por tu interés",
    body: 'Hemos recibido tu solicitud de información sobre <strong style="color:#f4f0e8;">{project}</strong>. Un asesor especializado se pondrá en contacto contigo en las próximas 24 horas.',
  },

  cotizacionBuyer: {
    subject: "Tu cotización — {project}",
    heading: "Tu cotización está lista",
    labels: { unit: "Unidad", total: "Total" },
    body: "Adjunto encontrarás tu cotización en PDF con el desglose completo del plan de pagos.",
    filename: "Cotizacion",
    defaultSaludo: "Gracias por tu interés en nuestro proyecto.",
    defaultDespedida: "El equipo comercial",
    whatsappCta: "Escribir por WhatsApp",
    tourCta: "Ver Tour 360",
    brochureCta: "Ver Brochure",
    micrositeCta: "Ver Proyecto",
  },

  cotizacionAdmin: {
    subject: "Nueva cotización — {project}",
    heading: "Nueva cotización solicitada",
    labels: { client: "Cliente", email: "Email", phone: "Teléfono", unit: "Unidad", total: "Total" },
  },

  welcome: {
    subject: "Bienvenido a NODDO",
    heading: "Bienvenido a NODDO",
    body: 'Tu cuenta está lista con el plan <strong style="color:#f4f0e8;">{plan}</strong> ({price}). Crea tu primer proyecto y lanza un micrositio premium para tu desarrollo inmobiliario en minutos.',
    createProject: "Crear mi primer proyecto",
    needMore: "¿Necesitas más features?",
    viewPlans: "Ver planes",
    planPrices: { basic: "$79/mes", premium: "$149/mes", enterprise: "desde $499/mes" },
  },

  collaboratorInvite: {
    subject: "{inviter} te invita a colaborar en NODDO",
    heading: "Has sido invitado",
    body: '<strong style="color:#f4f0e8;">{inviter}</strong> te ha invitado como colaborador en NODDO. Podrás gestionar el inventario de sus proyectos inmobiliarios.',
    cta: "Acceder a NODDO",
  },

  bookingConfirmation: {
    subject: "Tu demo con NODDO — {date}",
    heading: "Tu demo está confirmada",
    body: "Tu demo con el equipo de NODDO ha sido agendada. Nos veremos para mostrarte cómo crear un showroom digital premium para tus proyectos.",
    labels: { date: "Fecha", time: "Hora", duration: "Duración", format: "Formato" },
    durationUnit: "minutos",
    formatValue: "Videollamada",
    whatToExpect: "Qué esperar en la demo",
    bullets: [
      "Recorrido completo por la plataforma",
      "Configuración personalizada para tu proyecto",
      "Resolución de dudas y próximos pasos",
    ],
    joinCall: "Unirme a la videollamada",
    goToNoddo: "Ir a NODDO",
  },

  bookingAdmin: {
    subject: "Nueva demo agendada — {lead}",
    heading: "Nueva demo agendada",
    labels: {
      name: "Nombre",
      email: "Email",
      phone: "Teléfono",
      company: "Empresa",
      date: "Fecha",
      time: "Hora",
      source: "Fuente",
      campaign: "Campaña",
    },
  },

  bookingReminder: {
    subject24h: "Tu demo es mañana — NODDO",
    subject2h: "Tu demo es en 2 horas — NODDO",
    heading24h: "Tu demo es mañana",
    heading2h: "Tu demo es en 2 horas",
    body24h: 'Solo un recordatorio: tu demo con NODDO es mañana <strong style="color:#f4f0e8;">{date}</strong> a las <strong style="color:#f4f0e8;">{time}</strong>. Prepara tus preguntas — queremos que aproveches al máximo la sesión.',
    body2h: 'Tu demo con NODDO comienza en 2 horas a las <strong style="color:#f4f0e8;">{time}</strong>. ¡Te esperamos!',
    joinCall: "Unirme a la videollamada",
    goToNoddo: "Ir a NODDO",
  },

  noShow: {
    subject: "¿Todo bien? Tu demo con NODDO",
    heading: "¿Todo bien?",
    body: "Vimos que no pudiste conectarte a la demo de hoy. No te preocupes, entendemos que las agendas se complican. Si aún te interesa ver cómo NODDO puede transformar la comercialización de tus proyectos, puedes reagendar cuando quieras.",
    rescheduleCta: "Reagendar demo",
    whatsappNote: 'También puedes escribirnos por <a href="https://wa.me/971585407848?text=Hola,%20quiero%20reagendar%20mi%20demo%20de%20NODDO" style="color:#b8973a;text-decoration:underline;">WhatsApp</a> si prefieres.',
  },

  planUpgrade: {
    subject: "Bienvenido a {plan} — NODDO",
    heading: "Bienvenido a {plan}",
    body: 'Tu plan ha sido actualizado de <strong style="color:#f4f0e8;">{oldPlan}</strong> a <strong style="color:#b8973a;">{newPlan}</strong> ({price}). Ya puedes aprovechar todas las nuevas features.',
    labels: { newPlan: "Plan nuevo", maxProjects: "Max proyectos", maxUnits: "Max unidades" },
    unlimited: "Ilimitados",
    unlimitedFem: "Ilimitadas",
    featuresUnlocked: "Nuevas features desbloqueadas",
    exploreCta: "Explorar mis proyectos",
    features: {
      premium: [
        "Videos inmersivos (Cloudflare Stream)",
        "Mapas interactivos con POIs",
        "Tours 360° (Matterport/Kuula)",
        "Analytics avanzado",
        "Dominio personalizado",
      ],
      enterprise: [
        "Todo en Premium +",
        "White-label (sin marca NODDO)",
        "API REST + Webhooks",
        "Importación CSV masiva",
        "Soporte 24/7 con SLA",
      ],
    },
  },

  featureBlocked: {
    subject: "Desbloquea {feature} — NODDO",
    heading: "Desbloquea {feature}",
    body: 'Intentaste usar <strong style="color:#f4f0e8;">{feature}</strong>, pero esta feature requiere el plan <strong style="color:#b8973a;">{plan}</strong> ({price}).',
    body2: "Actualiza tu plan y desbloquea esta y muchas otras features premium para maximizar la comercialización de tus proyectos.",
    upgradeCta: "Actualizar a {plan}",
  },
};

/* ── English ────────────────────────────────────────────────────────── */

const en: EmailStrings = {
  shared: {
    hello: "Hello",
    viewLeads: "View Leads",
    viewProjects: "Explore my projects",
    questions: 'Questions? Email us at <a href="mailto:hola@noddo.io" style="color:#b8973a;text-decoration:underline;">hola@noddo.io</a>',
    footer: {
      company: "Noddo Technologies SAS · Bogota, Colombia",
      privacy: "Privacy",
      terms: "Terms",
      unsubscribe: "Unsubscribe",
    },
  },

  leadNotification: {
    subject: "New lead on {project} — NODDO",
    heading: "New lead received",
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      country: "Country",
      typology: "Typology of interest",
      message: "Message",
    },
  },

  leadConfirmation: {
    subject: "Thank you for your interest in {project}",
    heading: "Thank you for your interest",
    body: 'We have received your request for information about <strong style="color:#f4f0e8;">{project}</strong>. A specialized advisor will contact you within the next 24 hours.',
  },

  cotizacionBuyer: {
    subject: "Your quote — {project}",
    heading: "Your quote is ready",
    labels: { unit: "Unit", total: "Total" },
    body: "Attached you will find your quote in PDF with the complete breakdown of the payment plan.",
    filename: "Quote",
    defaultSaludo: "Thank you for your interest in our project.",
    defaultDespedida: "The sales team",
    whatsappCta: "Message on WhatsApp",
    tourCta: "View Tour 360",
    brochureCta: "View Brochure",
    micrositeCta: "View Project",
  },

  cotizacionAdmin: {
    subject: "New quote — {project}",
    heading: "New quote requested",
    labels: { client: "Client", email: "Email", phone: "Phone", unit: "Unit", total: "Total" },
  },

  welcome: {
    subject: "Welcome to NODDO",
    heading: "Welcome to NODDO",
    body: 'Your account is ready with the <strong style="color:#f4f0e8;">{plan}</strong> plan ({price}). Create your first project and launch a premium microsite for your real estate development in minutes.',
    createProject: "Create my first project",
    needMore: "Need more features?",
    viewPlans: "View plans",
    planPrices: { basic: "$79/mo", premium: "$149/mo", enterprise: "from $499/mo" },
  },

  collaboratorInvite: {
    subject: "{inviter} invites you to collaborate on NODDO",
    heading: "You have been invited",
    body: '<strong style="color:#f4f0e8;">{inviter}</strong> has invited you as a collaborator on NODDO. You will be able to manage the inventory of their real estate projects.',
    cta: "Go to NODDO",
  },

  bookingConfirmation: {
    subject: "Your NODDO demo — {date}",
    heading: "Your demo is confirmed",
    body: "Your demo with the NODDO team has been scheduled. We will show you how to create a premium digital showroom for your projects.",
    labels: { date: "Date", time: "Time", duration: "Duration", format: "Format" },
    durationUnit: "minutes",
    formatValue: "Video call",
    whatToExpect: "What to expect",
    bullets: [
      "Full platform walkthrough",
      "Custom setup for your project",
      "Q&A and next steps",
    ],
    joinCall: "Join video call",
    goToNoddo: "Go to NODDO",
  },

  bookingAdmin: {
    subject: "New demo scheduled — {lead}",
    heading: "New demo scheduled",
    labels: {
      name: "Name",
      email: "Email",
      phone: "Phone",
      company: "Company",
      date: "Date",
      time: "Time",
      source: "Source",
      campaign: "Campaign",
    },
  },

  bookingReminder: {
    subject24h: "Your demo is tomorrow — NODDO",
    subject2h: "Your demo is in 2 hours — NODDO",
    heading24h: "Your demo is tomorrow",
    heading2h: "Your demo is in 2 hours",
    body24h: 'Just a reminder: your NODDO demo is tomorrow <strong style="color:#f4f0e8;">{date}</strong> at <strong style="color:#f4f0e8;">{time}</strong>. Prepare your questions — we want you to make the most of the session.',
    body2h: 'Your NODDO demo starts in 2 hours at <strong style="color:#f4f0e8;">{time}</strong>. See you there!',
    joinCall: "Join video call",
    goToNoddo: "Go to NODDO",
  },

  noShow: {
    subject: "Everything OK? Your NODDO demo",
    heading: "Everything OK?",
    body: "We noticed you couldn't make it to today's demo. No worries — we understand schedules can get busy. If you're still interested in seeing how NODDO can transform the way you market your projects, you can reschedule anytime.",
    rescheduleCta: "Reschedule demo",
    whatsappNote: 'You can also reach us on <a href="https://wa.me/971585407848?text=Hi,%20I%20want%20to%20reschedule%20my%20NODDO%20demo" style="color:#b8973a;text-decoration:underline;">WhatsApp</a> if you prefer.',
  },

  planUpgrade: {
    subject: "Welcome to {plan} — NODDO",
    heading: "Welcome to {plan}",
    body: 'Your plan has been upgraded from <strong style="color:#f4f0e8;">{oldPlan}</strong> to <strong style="color:#b8973a;">{newPlan}</strong> ({price}). You can now take advantage of all the new features.',
    labels: { newPlan: "New plan", maxProjects: "Max projects", maxUnits: "Max units" },
    unlimited: "Unlimited",
    unlimitedFem: "Unlimited",
    featuresUnlocked: "New features unlocked",
    exploreCta: "Explore my projects",
    features: {
      premium: [
        "Immersive videos (Cloudflare Stream)",
        "Interactive maps with POIs",
        "360° tours (Matterport/Kuula)",
        "Advanced analytics",
        "Custom domain",
      ],
      enterprise: [
        "Everything in Premium +",
        "White-label (no NODDO branding)",
        "REST API + Webhooks",
        "Bulk CSV import",
        "24/7 support with SLA",
      ],
    },
  },

  featureBlocked: {
    subject: "Unlock {feature} — NODDO",
    heading: "Unlock {feature}",
    body: 'You tried to use <strong style="color:#f4f0e8;">{feature}</strong>, but this feature requires the <strong style="color:#b8973a;">{plan}</strong> plan ({price}).',
    body2: "Upgrade your plan and unlock this and many other premium features to maximize the marketing of your projects.",
    upgradeCta: "Upgrade to {plan}",
  },
};

/* ── Accessor ───────────────────────────────────────────────────────── */

const STRINGS: Record<EmailLocale, EmailStrings> = { es, en };

export function getEmailStrings(locale: EmailLocale = "es"): EmailStrings {
  return STRINGS[locale] ?? STRINGS.es;
}

/* ── Template helper — replace {key} placeholders ───────────────────── */

export function t(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

/* ── Locale for Intl.DateTimeFormat ─────────────────────────────────── */

export function dateLocale(locale: EmailLocale): string {
  return locale === "en" ? "en-US" : "es-CO";
}
