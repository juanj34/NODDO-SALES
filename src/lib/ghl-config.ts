/**
 * GoHighLevel configuration for NODDO marketing.
 *
 * Uses the existing "Cold-leads" pipeline by default.
 * Override with env vars if you create a dedicated "NODDO Sales" pipeline.
 */

// ─── Pipeline ───────────────────────────────────────────────────────────

/** Pipeline ID — defaults to existing "Cold-leads" pipeline */
export const GHL_PIPELINE_ID =
  process.env.GHL_PIPELINE_ID || "0hRydDZayfBY8GFYd40w";

/**
 * Pipeline stage IDs.
 * Mapped to existing Cold-leads stages where possible.
 * Empty string = stage not available (opportunity creation skipped).
 */
export const GHL_STAGES: Record<string, string> = {
  nuevo_prospecto:
    process.env.GHL_STAGE_NUEVO_PROSPECTO ||
    "6e3665d2-8a99-4441-8fec-bc35bda4acf0", // "New Lead"
  demo_agendado:
    process.env.GHL_STAGE_DEMO_AGENDADO ||
    "f1ddc370-2e64-42bb-9532-9127f855d963", // "Reunión Agendada"
  demo_realizado:
    process.env.GHL_STAGE_DEMO_REALIZADO || "",
  propuesta_enviada:
    process.env.GHL_STAGE_PROPUESTA_ENVIADA || "",
  negociacion:
    process.env.GHL_STAGE_NEGOCIACION || "",
  cerrado_ganado:
    process.env.GHL_STAGE_CERRADO_GANADO || "",
  cerrado_perdido:
    process.env.GHL_STAGE_CERRADO_PERDIDO || "",
};

// ─── Tags ───────────────────────────────────────────────────────────────

export const GHL_TAGS = {
  // Engagement
  pricing_viewed: "pricing-viewed",
  demo_live_viewed: "demo-live-viewed",
  high_engagement: "high-engagement",
  high_intent: "high-intent",
  cta_clicked: "cta-clicked",

  // Plans (all-inclusive tiers)
  plan_proyecto: "plan-proyecto",
  plan_studio: "plan-studio",
  plan_enterprise: "plan-enterprise",

  // Booking
  demo_booked: "demo-booked",
  demo_attended: "demo-attended",
  demo_no_show: "demo-no-show",

  // Forms
  contact_form: "contact-form",

  // Content
  brochure_downloaded: "brochure-downloaded",
  lead_magnet: "lead-magnet",
} as const;

// ─── Custom Field Keys (as created in GHL) ──────────────────────────────

export const GHL_CUSTOM_FIELDS = {
  plan_interes: "contact.plan_de_inters",
  pagina_origen: "contact.pgina_de_origen",
  num_proyectos: "contact.nmero_de_proyectos",
  pais: "contact.pas",
} as const;

// ─── Plan values (USD/month) - All-inclusive pricing ────────────────────

export const PLAN_VALUES: Record<string, number> = {
  proyecto: 149,
  studio: 399,
  enterprise: 799, // Starting price, custom pricing for large clients
};
