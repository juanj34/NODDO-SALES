"use client";

import { motion } from "framer-motion";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

/* ── Column header icons ── */

/** Brochure PDF — document page with text lines */
function IconBrochure() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
      {/* Page with folded corner */}
      <path d="M10 4 H26 L32 10 V36 H10 Z" stroke="rgba(244,240,232,0.4)" strokeWidth="1" />
      <path d="M26 4 V10 H32" stroke="rgba(244,240,232,0.3)" strokeWidth="0.8" />
      {/* Text lines */}
      <line x1="15" y1="16" x2="27" y2="16" stroke="rgba(244,240,232,0.2)" strokeWidth="0.8" />
      <line x1="15" y1="20" x2="25" y2="20" stroke="rgba(244,240,232,0.15)" strokeWidth="0.8" />
      <line x1="15" y1="24" x2="27" y2="24" stroke="rgba(244,240,232,0.2)" strokeWidth="0.8" />
      <line x1="15" y1="28" x2="22" y2="28" stroke="rgba(244,240,232,0.12)" strokeWidth="0.8" />
    </svg>
  );
}

/** NODDO — dashboard screen with panels */
function IconNoddoDashboard() {
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 52 36" fill="none" width="52" height="36">
        {/* Screen frame */}
        <rect x="1" y="1" width="50" height="30" rx="2" stroke="#b8973a" strokeWidth="1" opacity="0.6" />
        {/* Title bar */}
        <line x1="1" y1="7" x2="51" y2="7" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
        {/* 3 dots */}
        <circle cx="5" cy="4" r="1" fill="rgba(184,151,58,0.4)" />
        <circle cx="9" cy="4" r="1" fill="rgba(184,151,58,0.3)" />
        <circle cx="13" cy="4" r="1" fill="rgba(184,151,58,0.2)" />
        {/* Sidebar */}
        <line x1="14" y1="7" x2="14" y2="31" stroke="#b8973a" strokeWidth="0.4" opacity="0.2" />
        {/* Sidebar nav lines */}
        <line x1="4" y1="12" x2="11" y2="12" stroke="#b8973a" strokeWidth="0.5" opacity="0.3" />
        <line x1="4" y1="16" x2="10" y2="16" stroke="#b8973a" strokeWidth="0.5" opacity="0.2" />
        <line x1="4" y1="20" x2="11" y2="20" stroke="#b8973a" strokeWidth="0.5" opacity="0.2" />
        {/* Main content — stat cards */}
        <rect x="17" y="10" width="14" height="8" rx="1" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" />
        <rect x="34" y="10" width="14" height="8" rx="1" stroke="#b8973a" strokeWidth="0.5" opacity="0.35" />
        {/* Building grid area */}
        <rect x="17" y="21" width="31" height="8" rx="1" stroke="#b8973a" strokeWidth="0.5" opacity="0.25" />
        {/* Grid dots inside */}
        {[0, 1, 2, 3, 4, 5].map(c => (
          <circle key={c} cx={21 + c * 5} cy="25" r="1.2" fill="#b8973a" opacity={c % 3 === 0 ? "0.5" : "0.25"} />
        ))}
        {/* Screen stand */}
        <line x1="22" y1="31" x2="30" y2="35" stroke="#b8973a" strokeWidth="0.6" opacity="0.3" />
        <line x1="30" y1="31" x2="22" y2="35" stroke="#b8973a" strokeWidth="0.6" opacity="0.3" />
      </svg>
      <NodDoLogo height={10} colorNod="#b8973a" colorDo="#b8973a" />
    </div>
  );
}

/** Software 3D — isometric cube / 3D model */
function IconSoftware3D() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width="36" height="36">
      {/* Isometric cube */}
      <polygon points="20,4 36,13 36,27 20,36 4,27 4,13" stroke="rgba(244,240,232,0.35)" strokeWidth="0.8" />
      {/* Top face */}
      <polygon points="20,4 36,13 20,22 4,13" stroke="rgba(244,240,232,0.3)" strokeWidth="0.6" fill="rgba(244,240,232,0.03)" />
      {/* Center vertical edge */}
      <line x1="20" y1="22" x2="20" y2="36" stroke="rgba(244,240,232,0.25)" strokeWidth="0.6" />
      {/* Left face diagonal */}
      <line x1="4" y1="13" x2="20" y2="22" stroke="rgba(244,240,232,0.2)" strokeWidth="0.6" />
      {/* Right face diagonal */}
      <line x1="36" y1="13" x2="20" y2="22" stroke="rgba(244,240,232,0.2)" strokeWidth="0.6" />
      {/* Grid lines on top face */}
      <line x1="12" y1="8.5" x2="28" y2="17.5" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
      <line x1="12" y1="17.5" x2="28" y2="8.5" stroke="rgba(244,240,232,0.1)" strokeWidth="0.4" />
    </svg>
  );
}

const features = [
  { label: "Tiempo hasta publicar", brochure: { icon: "~", text: "1–2 semanas" }, noddo: { icon: "✓", text: "1 día" }, agency: { icon: "✗", text: "3–6 meses" } },
  { label: "Fachada interactiva por unidad", brochure: { icon: "✗", text: "No" }, noddo: { icon: "✓", text: "Noddo Grid" }, agency: { icon: "~", text: "A veces, extra" } },
  { label: "Inventario en tiempo real", brochure: { icon: "✗", text: "No" }, noddo: { icon: "✓", text: "Siempre al día" }, agency: { icon: "✗", text: "No" } },
  { label: "Captura de leads + UTM", brochure: { icon: "✗", text: "No" }, noddo: { icon: "✓", text: "Por unidad y fuente" }, agency: { icon: "✗", text: "Requiere extra" } },
  { label: "Edición sin intermediarios", brochure: { icon: "~", text: "Manual y lento" }, noddo: { icon: "✓", text: "Tú, en tiempo real" }, agency: { icon: "✗", text: "Pagas cada cambio" } },
  { label: "Multi-proyecto", brochure: { icon: "~", text: "Archivos separados" }, noddo: { icon: "✓", text: "Dashboard unificado" }, agency: { icon: "✗", text: "Contrato por proyecto" } },
  { label: "Planos, renders y avance de obra", brochure: { icon: "~", text: "Adjuntos estáticos" }, noddo: { icon: "✓", text: "Integrado en la sala" }, agency: { icon: "~", text: "Solo renders" } },
  { label: "Implementación asistida", brochure: { icon: "✗", text: "Sin soporte" }, noddo: { icon: "✓", text: "Incluida" }, agency: { icon: "~", text: "Project manager" } },
];

const badges = [
  { label: "SSL Incluido", gold: true },
  { label: "Dominio Personalizado", gold: true },
  { label: "GDPR Ready", gold: false },
  { label: "99.9% Uptime", gold: false },
  { label: "Soporte en Español", gold: true },
  { label: "Implementación incluida", gold: false },
];

function iconColor(icon: string) {
  if (icon === "✓") return "#2d7a4a";
  if (icon === "✗") return "rgba(200,50,50,0.6)";
  return "#b8863a";
}

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function ComparisonStrip() {
  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">La comparación real</div>

        <h2 className="mk-section-heading mb-4">
          Una herramienta<br />
          que <em>las reemplaza</em> a todas.
        </h2>

        <p className="text-[14px] leading-[1.8] max-w-[520px] mb-14" style={{ color: "rgba(244,240,232,0.55)" }}>
          Tres opciones que los desarrolladores usan para vender. Solo una que las hace innecesarias.
        </p>

        {/* Desktop table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="hidden md:block"
          style={{ border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th
                  className="text-left"
                  style={{ width: "28%", padding: "0 0 0 28px", verticalAlign: "bottom" }}
                />
                {/* Brochure */}
                <th
                  className="text-center"
                  style={{
                    width: "24%",
                    padding: "32px 20px 24px",
                    borderLeft: "1px solid rgba(255,255,255,0.04)",
                    verticalAlign: "bottom",
                  }}
                >
                  <div style={{ marginBottom: 10 }}><IconBrochure /></div>
                  <div className="font-ui text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(244,240,232,0.5)", marginBottom: 6 }}>
                    Brochure PDF
                  </div>
                  <div className="font-heading text-[16px] font-light" style={{ color: "rgba(244,240,232,0.5)" }}>
                    $0 – $2,000
                  </div>
                </th>
                {/* NODDO */}
                <th
                  className="text-center relative"
                  style={{
                    width: "24%",
                    padding: "32px 20px 24px",
                    background: "rgba(184,151,58,0.06)",
                    borderLeft: "1px solid rgba(184,151,58,0.25)",
                    borderRight: "1px solid rgba(184,151,58,0.25)",
                    verticalAlign: "bottom",
                  }}
                >
                  <div
                    className="absolute font-ui text-[8px] font-bold tracking-[0.18em] uppercase"
                    style={{
                      top: -1,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "var(--mk-accent)",
                      color: "var(--mk-bg)",
                      padding: "4px 14px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Recomendado
                  </div>
                  <div style={{ marginBottom: 10 }}><IconNoddoDashboard /></div>
                  <div className="font-heading text-[16px] font-light" style={{ color: "var(--mk-accent)" }}>
                    $149 – $399 / mes
                  </div>
                </th>
                {/* Agencia */}
                <th
                  className="text-center"
                  style={{
                    width: "24%",
                    padding: "32px 20px 24px",
                    borderLeft: "1px solid rgba(255,255,255,0.04)",
                    verticalAlign: "bottom",
                  }}
                >
                  <div style={{ marginBottom: 10 }}><IconSoftware3D /></div>
                  <div className="font-ui text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(244,240,232,0.5)", marginBottom: 6 }}>
                    Software 3D · Maqueta
                  </div>
                  <div className="font-heading text-[16px] font-light" style={{ color: "rgba(244,240,232,0.5)" }}>
                    $30k – $80k
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((f) => (
                <tr
                  key={f.label}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <td style={{ padding: "16px 20px 16px 28px", color: "rgba(244,240,232,0.65)", fontSize: 12 }}>
                    {f.label}
                  </td>
                  <td className="text-center" style={{ padding: "16px 12px", color: "rgba(244,240,232,0.5)", fontSize: 11, borderLeft: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" }}>
                    <span style={{ color: iconColor(f.brochure.icon), marginRight: 5 }}>{f.brochure.icon}</span>
                    {f.brochure.text}
                  </td>
                  <td
                    className="text-center"
                    style={{
                      padding: "16px 12px",
                      background: "rgba(184,151,58,0.04)",
                      color: "rgba(244,240,232,0.85)",
                      fontSize: 11,
                      borderLeft: "1px solid rgba(184,151,58,0.2)",
                      borderRight: "1px solid rgba(184,151,58,0.2)",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    <span style={{ color: iconColor(f.noddo.icon), marginRight: 5 }}>{f.noddo.icon}</span>
                    {f.noddo.text}
                  </td>
                  <td className="text-center" style={{ padding: "16px 12px", color: "rgba(244,240,232,0.5)", fontSize: 11, borderLeft: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" }}>
                    <span style={{ color: iconColor(f.agency.icon), marginRight: 5 }}>{f.agency.icon}</span>
                    {f.agency.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile card layout */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="md:hidden flex flex-col gap-px"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {features.map((f) => (
            <div
              key={f.label}
              style={{ background: "var(--mk-bg)", padding: "16px 0" }}
            >
              <div
                className="font-ui text-[11px] font-semibold tracking-[0.04em] mb-3"
                style={{ color: "rgba(244,240,232,0.7)" }}
              >
                {f.label}
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div style={{ fontSize: 11, color: "rgba(244,240,232,0.45)" }}>
                  <div className="font-ui text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(244,240,232,0.3)" }}>Brochure</div>
                  <span style={{ color: iconColor(f.brochure.icon), marginRight: 3 }}>{f.brochure.icon}</span>
                  {f.brochure.text}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(244,240,232,0.85)",
                    fontWeight: 500,
                    background: "rgba(184,151,58,0.06)",
                    padding: "6px 8px",
                    border: "1px solid rgba(184,151,58,0.15)",
                  }}
                >
                  <div className="font-ui text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: "var(--mk-accent)" }}>Noddo</div>
                  <span style={{ color: iconColor(f.noddo.icon), marginRight: 3 }}>{f.noddo.icon}</span>
                  {f.noddo.text}
                </div>
                <div style={{ fontSize: 11, color: "rgba(244,240,232,0.45)" }}>
                  <div className="font-ui text-[8px] tracking-[0.12em] uppercase mb-1" style={{ color: "rgba(244,240,232,0.3)" }}>Software 3D</div>
                  <span style={{ color: iconColor(f.agency.icon), marginRight: 3 }}>{f.agency.icon}</span>
                  {f.agency.text}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Badges */}
        <div className="flex flex-wrap gap-3 justify-center mt-12">
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-1.5 font-ui text-[9px] tracking-[0.18em] uppercase"
              style={{
                padding: "7px 14px",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(244,240,232,0.4)",
              }}
            >
              <div
                className="flex-shrink-0"
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: b.gold ? "var(--mk-accent)" : "#2d7a4a",
                }}
              />
              {b.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
