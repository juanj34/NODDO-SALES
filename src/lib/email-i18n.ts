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
  labels: {
    unit: string;
    total: string;
    tipologia: string;
    area: string;
    habitaciones: string;
    banos: string;
  };
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
  bodyDirector: string;
  bodyAsesor: string;
  cta: string;
}

interface CollaboratorWelcomeStrings {
  subject: string;
  heading: string;
  bodyDirector: string;
  bodyAsesor: string;
  cta: string;
}

interface CollaboratorStatusStrings {
  subjectSuspended: string;
  subjectReactivated: string;
  headingSuspended: string;
  headingReactivated: string;
  bodySuspended: string;
  bodyReactivated: string;
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

interface AdminInviteStrings {
  subject: string;
  heading: string;
  body: string;
  cta: string;
}

/* ── Full locale bundle ─────────────────────────────────────────────── */

/* ── Billing email strings ──────────────────────────────────────────── */

interface InvoiceStrings {
  subject: string;
  heading: string;
  body: string;
  planLabel: string;
  amountLabel: string;
  dueDateLabel: string;
  periodLabel: string;
  cta: string;
}

interface PaymentReminderStrings {
  subject: string;
  heading: string;
  body: string;
  cta: string;
}

interface PaymentOverdueStrings {
  subject: string;
  heading: string;
  body: string;
  warning: string;
  cta: string;
}

interface PaymentReceiptStrings {
  subject: string;
  heading: string;
  body: string;
  amountLabel: string;
  methodLabel: string;
  nextBillingLabel: string;
  cta: string;
}

interface PlanUpgradeStrings {
  subject: string;
  heading: string;
  body: string;
  newPlanLabel: string;
  featuresHeading: string;
  cta: string;
}

export interface EmailStrings {
  shared: SharedStrings;
  leadNotification: LeadNotificationStrings;
  leadConfirmation: LeadConfirmationStrings;
  cotizacionBuyer: CotizacionBuyerStrings;
  cotizacionAdmin: CotizacionAdminStrings;
  welcome: WelcomeStrings;
  collaboratorInvite: CollaboratorInviteStrings;
  collaboratorWelcome: CollaboratorWelcomeStrings;
  collaboratorStatus: CollaboratorStatusStrings;
  bookingConfirmation: BookingConfirmationStrings;
  bookingAdmin: BookingAdminStrings;
  bookingReminder: BookingReminderStrings;
  noShow: NoShowStrings;
  adminInvite: AdminInviteStrings;
  invoice: InvoiceStrings;
  paymentReminder: PaymentReminderStrings;
  paymentOverdue: PaymentOverdueStrings;
  paymentReceipt: PaymentReceiptStrings;
  planUpgrade: PlanUpgradeStrings;
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
    labels: {
      unit: "Unidad",
      total: "Total",
      tipologia: "Tipología",
      area: "Área",
      habitaciones: "Habitaciones",
      banos: "Baños",
    },
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
    bodyDirector: '<strong style="color:#f4f0e8;">{inviter}</strong> te ha invitado como <strong style="color:#b8973a;">Director</strong> en NODDO. Podrás gestionar contenido, leads e inventario de los proyectos asignados.',
    bodyAsesor: '<strong style="color:#f4f0e8;">{inviter}</strong> te ha invitado como <strong style="color:#b8973a;">Asesor</strong> en NODDO. Podrás gestionar disponibilidad, NodDo Quote y tus leads asignados.',
    cta: "Acceder a NODDO",
  },

  collaboratorWelcome: {
    subject: "Bienvenido a NODDO",
    heading: "Bienvenido al equipo",
    bodyDirector: 'Tu cuenta como <strong style="color:#b8973a;">Director</strong> está activa. Ya puedes acceder a los proyectos asignados y gestionar contenido, leads e inventario.',
    bodyAsesor: 'Tu cuenta como <strong style="color:#b8973a;">Asesor</strong> está activa. Ya puedes acceder a disponibilidad, NodDo Quote y tus leads asignados.',
    cta: "Ir a NODDO",
  },

  collaboratorStatus: {
    subjectSuspended: "Tu acceso a NODDO ha sido suspendido",
    subjectReactivated: "Tu acceso a NODDO ha sido reactivado",
    headingSuspended: "Acceso suspendido",
    headingReactivated: "Acceso reactivado",
    bodySuspended: "Tu acceso a la plataforma NODDO ha sido suspendido por el administrador. Si crees que esto es un error, contacta a tu administrador.",
    bodyReactivated: "Tu acceso a la plataforma NODDO ha sido reactivado. Ya puedes volver a iniciar sesión y acceder a tus proyectos asignados.",
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

  adminInvite: {
    subject: "Tu cuenta en NODDO esta lista",
    heading: "Bienvenido a NODDO",
    body: 'Has sido invitado a la plataforma NODDO. Tu plan: <strong style="color:#b8973a;">{plan}</strong>. Haz clic en el boton de abajo para activar tu cuenta y comenzar a crear micrositios premium para tus proyectos.',
    cta: "Activar Cuenta",
  },

  invoice: {
    subject: "Factura {invoiceNumber} — NODDO",
    heading: "Tu factura de NODDO",
    body: "Aquí tienes tu factura para el periodo de {periodStart} a {periodEnd}. Por favor realiza el pago antes de la fecha de vencimiento.",
    planLabel: "Plan",
    amountLabel: "Monto",
    dueDateLabel: "Fecha de vencimiento",
    periodLabel: "Periodo",
    cta: "Ver Factura",
  },
  paymentReminder: {
    subject: "Recordatorio de pago — NODDO",
    heading: "Tu pago está próximo a vencer",
    body: "Te recordamos que tu factura {invoiceNumber} por {amount} vence el {dueDate}. Realiza el pago a tiempo para mantener tu servicio activo.",
    cta: "Realizar Pago",
  },
  paymentOverdue: {
    subject: "Pago vencido — NODDO",
    heading: "Tu pago está vencido",
    body: "Tu factura {invoiceNumber} por {amount} venció el {dueDate}.",
    warning: "Si el pago no se realiza pronto, tu servicio podría ser suspendido. Por favor ponte en contacto con nosotros si necesitas asistencia.",
    cta: "Pagar Ahora",
  },
  paymentReceipt: {
    subject: "Confirmación de pago — NODDO",
    heading: "Pago recibido",
    body: "Hemos recibido tu pago exitosamente. Gracias por confiar en NODDO.",
    amountLabel: "Monto pagado",
    methodLabel: "Método de pago",
    nextBillingLabel: "Próximo cobro",
    cta: "Ver Mi Cuenta",
  },
  planUpgrade: {
    subject: "Plan actualizado a {plan} — NODDO",
    heading: "¡Tu plan ha sido actualizado!",
    body: "Tu proyecto ahora tiene acceso a todas las funciones del plan {plan}.",
    newPlanLabel: "Nuevo plan",
    featuresHeading: "Ahora tienes acceso a:",
    cta: "Explorar Nuevas Funciones",
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
    labels: {
      unit: "Unit",
      total: "Total",
      tipologia: "Type",
      area: "Area",
      habitaciones: "Bedrooms",
      banos: "Bathrooms",
    },
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
    bodyDirector: '<strong style="color:#f4f0e8;">{inviter}</strong> has invited you as a <strong style="color:#b8973a;">Director</strong> on NODDO. You will be able to manage content, leads, and inventory for assigned projects.',
    bodyAsesor: '<strong style="color:#f4f0e8;">{inviter}</strong> has invited you as an <strong style="color:#b8973a;">Advisor</strong> on NODDO. You will be able to manage availability, quotations, and your assigned leads.',
    cta: "Go to NODDO",
  },

  collaboratorWelcome: {
    subject: "Welcome to NODDO",
    heading: "Welcome to the team",
    bodyDirector: 'Your <strong style="color:#b8973a;">Director</strong> account is active. You can now access assigned projects and manage content, leads, and inventory.',
    bodyAsesor: 'Your <strong style="color:#b8973a;">Advisor</strong> account is active. You can now access availability, quotation tools, and your assigned leads.',
    cta: "Go to NODDO",
  },

  collaboratorStatus: {
    subjectSuspended: "Your NODDO access has been suspended",
    subjectReactivated: "Your NODDO access has been reactivated",
    headingSuspended: "Access suspended",
    headingReactivated: "Access reactivated",
    bodySuspended: "Your access to the NODDO platform has been suspended by the administrator. If you believe this is an error, please contact your administrator.",
    bodyReactivated: "Your access to the NODDO platform has been reactivated. You can now log in again and access your assigned projects.",
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

  adminInvite: {
    subject: "Your NODDO account is ready",
    heading: "Welcome to NODDO",
    body: 'You have been invited to the NODDO platform. Your plan: <strong style="color:#b8973a;">{plan}</strong>. Click the button below to activate your account and start creating premium microsites for your projects.',
    cta: "Activate Account",
  },

  invoice: {
    subject: "Invoice {invoiceNumber} — NODDO",
    heading: "Your NODDO invoice",
    body: "Here is your invoice for the period from {periodStart} to {periodEnd}. Please complete payment before the due date.",
    planLabel: "Plan",
    amountLabel: "Amount",
    dueDateLabel: "Due date",
    periodLabel: "Period",
    cta: "View Invoice",
  },
  paymentReminder: {
    subject: "Payment reminder — NODDO",
    heading: "Your payment is due soon",
    body: "This is a reminder that your invoice {invoiceNumber} for {amount} is due on {dueDate}. Please make your payment on time to keep your service active.",
    cta: "Make Payment",
  },
  paymentOverdue: {
    subject: "Payment overdue — NODDO",
    heading: "Your payment is overdue",
    body: "Your invoice {invoiceNumber} for {amount} was due on {dueDate}.",
    warning: "If payment is not received soon, your service may be suspended. Please contact us if you need assistance.",
    cta: "Pay Now",
  },
  paymentReceipt: {
    subject: "Payment confirmed — NODDO",
    heading: "Payment received",
    body: "We have successfully received your payment. Thank you for trusting NODDO.",
    amountLabel: "Amount paid",
    methodLabel: "Payment method",
    nextBillingLabel: "Next billing",
    cta: "View My Account",
  },
  planUpgrade: {
    subject: "Plan upgraded to {plan} — NODDO",
    heading: "Your plan has been upgraded!",
    body: "Your project now has access to all features in the {plan} plan.",
    newPlanLabel: "New plan",
    featuresHeading: "You now have access to:",
    cta: "Explore New Features",
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
