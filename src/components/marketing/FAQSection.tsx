"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const faqs = [
  {
    q: "¿Cuánto tiempo toma lanzar mi proyecto?",
    a: "Entre 1 y 3 días. Si tienes tu contenido listo (renders, planos, textos), puedes publicar en menos de 24 horas. Nuestro equipo te acompaña en el onboarding para acelerar el proceso — muchos clientes lanzan el mismo día.",
  },
  {
    q: "¿Necesito conocimientos técnicos o un equipo IT?",
    a: "No. Si sabes usar Excel y subir archivos a Drive, puedes usar Noddo. Está diseñado para directores comerciales y gerentes de proyectos, no para desarrolladores. Todo es punto-y-click, sin código.",
  },
  {
    q: "¿Cuánto cuesta? ¿Hay período de prueba?",
    a: "Los planes van desde $149/mes (1 proyecto) hasta Enterprise personalizado. Ofrecemos garantía de reembolso de 14 días — mejor que un trial porque ya tienes acceso completo. Si no te convence en 2 semanas, devolvemos el 100%.",
  },
  {
    q: "¿Cómo recibo los leads? ¿Se integra con mi CRM?",
    a: "Los leads llegan a tu dashboard con nombre, email, WhatsApp, unidad de interés y UTM de origen. También recibes notificaciones instantáneas por email. Integración directa con CRM (HubSpot, GoHighLevel, Salesforce) disponible en planes Studio y Enterprise.",
  },
  {
    q: "¿Puedo usar mi propio dominio en vez de .noddo.io?",
    a: "Sí. Desde el plan Studio puedes mapear tu dominio (ej: ventastorreazul.com). En Enterprise tienes white-label completo — el comprador nunca ve la marca Noddo. La configuración DNS es guiada paso a paso.",
  },
  {
    q: "¿Qué pasa con mis datos si cancelo o cambio de plan?",
    a: "Tienes acceso hasta el final del período pagado. Después, tu sitio se desactiva pero tus datos (leads, contenido, analytics) se conservan por 30 días. Puedes exportar todo en cualquier momento (JSON, CSV). Si haces downgrade, no pierdes información.",
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
                  fontSize: "clamp(14px, 1.5vw, 15px)",
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
                  fontSize: 14,
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
