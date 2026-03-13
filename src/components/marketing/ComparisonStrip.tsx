"use client";

import { motion } from "framer-motion";

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

        <p className="text-[14px] leading-[1.8] max-w-[520px] mb-14" style={{ color: "rgba(244,240,232,0.35)" }}>
          Tres opciones que los desarrolladores usan para vender. Solo una que las hace innecesarias.
        </p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease }}
          className="overflow-x-auto"
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
                  <div style={{ fontSize: 22, marginBottom: 10 }}>📄</div>
                  <div className="font-ui text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(244,240,232,0.4)", marginBottom: 6 }}>
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
                  <div className="font-ui text-[18px] font-extrabold" style={{ color: "var(--mk-accent)", marginBottom: 10 }}>
                    N·
                  </div>
                  <div className="font-ui text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "var(--mk-accent)", marginBottom: 6 }}>
                    NODDO
                  </div>
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
                  <div style={{ fontSize: 22, marginBottom: 10 }}>🎨</div>
                  <div className="font-ui text-[10px] font-bold tracking-[0.15em] uppercase" style={{ color: "rgba(244,240,232,0.4)", marginBottom: 6 }}>
                    Agencia 3D
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
