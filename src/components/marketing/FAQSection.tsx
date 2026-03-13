"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "¿Necesito saber programar para usar Noddo?",
    a: "No. Noddo está diseñado para directores comerciales y gerentes de proyectos, no para desarrolladores. Si sabes usar Google Drive, puedes usar Noddo. El onboarding completo toma menos de un día.",
  },
  {
    q: "¿Qué pasa si mi proyecto tiene más de 200 unidades?",
    a: "El plan Studio soporta unidades ilimitadas. Si estás en el plan Proyecto y tu torre crece, el upgrade es automático y proporcional. Nunca perderás datos ni configuración.",
  },
  {
    q: "¿Puedo usar mi propio dominio en vez de .noddo.io?",
    a: "Sí, desde el plan Studio puedes mapear tu propio dominio (ej. ventas.tuyedificio.com). En Enterprise tienes white-label completo — el comprador nunca ve la marca Noddo a menos que tú quieras.",
  },
  {
    q: "¿Cómo recibo los leads? ¿Se integra con mi CRM?",
    a: "Los leads llegan al dashboard de Noddo con nombre, correo, WhatsApp, unidad de interés y UTM de origen. También enviamos notificaciones por email y Slack. La integración directa con CRM (HubSpot, GHL, Salesforce) está disponible en Enterprise.",
  },
  {
    q: "¿Cómo funciona la implementación asistida?",
    a: "Cuando contratas Noddo, un especialista de nuestro equipo te acompaña en el onboarding. Configuramos el primer proyecto contigo — subimos los planos, armamos el Noddo Grid, conectamos el dominio y hacemos la primera publicación. Tiempo estimado: un día de trabajo conjunto.",
  },
  {
    q: "¿Noddo funciona para proyectos fuera de Colombia?",
    a: "Sí. Tenemos clientes activos en Colombia, México, Perú y Miami. La plataforma soporta múltiples monedas, idiomas y configuraciones fiscales. El soporte es en español y en horario americano.",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="relative z-[1] py-28 lg:py-40 px-6 lg:px-20 border-t border-[var(--mk-border-rule)]">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div className="mk-section-label mb-6">Preguntas frecuentes</div>

        <h2 className="mk-section-heading mb-16">
          Resolvemos<br />
          <em>tus dudas.</em>
        </h2>

        <div>
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              {/* Question */}
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                aria-expanded={openIdx === i}
                className="flex items-center justify-between w-full text-left gap-5"
                style={{
                  padding: "24px 0",
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "clamp(13px, 1.5vw, 14px)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: openIdx === i ? "var(--mk-text-primary)" : "rgba(244,240,232,0.65)",
                  transition: "color 0.2s",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span>{faq.q}</span>
                <span
                  aria-hidden="true"
                  className="flex items-center justify-center flex-shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    border: `1px solid ${openIdx === i ? "var(--mk-accent)" : "rgba(255,255,255,0.12)"}`,
                    fontSize: 12,
                    color: openIdx === i ? "var(--mk-accent)" : "rgba(244,240,232,0.35)",
                    transition: "transform 0.3s, border-color 0.2s, color 0.2s",
                    transform: openIdx === i ? "rotate(45deg)" : "none",
                  }}
                >
                  +
                </span>
              </button>

              {/* Answer */}
              <div
                style={{
                  maxHeight: openIdx === i ? 300 : 0,
                  overflow: "hidden",
                  transition: "max-height 0.4s ease, padding 0.3s ease",
                  paddingBottom: openIdx === i ? 24 : 0,
                  fontSize: 13,
                  lineHeight: 1.9,
                  color: "rgba(244,240,232,0.55)",
                }}
              >
                {faq.a}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
