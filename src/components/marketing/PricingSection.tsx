"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { useBooking } from "./BookingProvider";
import { useContact } from "./ContactProvider";
import { trackPricingPlanClicked } from "@/lib/marketing-tracking";
import { PLAN_VALUES } from "@/lib/ghl-config";

interface Plan {
  name: string;
  slug: string;
  price: string;
  pricePrefix?: string;
  period: string;
  features: { text: string; on: boolean }[];
  featured?: boolean;
  badge?: string;
  ctaLabel: string;
  ctaAction: "booking" | "contact";
}

const plans: Plan[] = [
  {
    name: "Basic",
    slug: "basic",
    pricePrefix: "$",
    price: "79",
    period: "USD/mes · o $63 con pago anual",
    features: [
      { text: "1 proyecto activo", on: true },
      { text: "Hasta 200 unidades", on: true },
      { text: "Galería + contacto + disponibilidad", on: true },
      { text: "10GB almacenamiento", on: true },
      { text: "Videos inmersivos", on: false },
      { text: "Mapas interactivos", on: false },
    ],
    ctaLabel: "Comenzar gratis",
    ctaAction: "booking",
  },
  {
    name: "Premium",
    slug: "premium",
    pricePrefix: "$",
    price: "149",
    period: "USD/mes · o $119 con pago anual",
    featured: true,
    badge: "Más popular",
    features: [
      { text: "5 proyectos activos", on: true },
      { text: "Unidades ilimitadas", on: true },
      { text: "TODO incluido: Videos, Mapas, Tours 360°", on: true },
      { text: "Analytics avanzado", on: true },
      { text: "Dominio personalizado", on: true },
      { text: "50GB por proyecto", on: true },
    ],
    ctaLabel: "Comenzar ahora",
    ctaAction: "booking",
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    price: "Desde $499",
    period: "USD/mes · contrato flexible",
    features: [
      { text: "Proyectos ilimitados", on: true },
      { text: "White-label completo", on: true },
      { text: "API + Webhooks", on: true },
      { text: "Importación CSV masiva", on: true },
      { text: "Soporte 24/7 + SLA", on: true },
      { text: "500GB total", on: true },
    ],
    ctaLabel: "Hablar con ventas",
    ctaAction: "contact",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function PricingSection() {
  const { openBooking } = useBooking();
  const { openContact } = useContact();

  const handlePlanClick = useCallback(
    (plan: Plan) => {
      // Track which plan was clicked
      trackPricingPlanClicked(plan.slug, PLAN_VALUES[plan.slug] || 149);

      if (plan.ctaAction === "contact") {
        openContact(plan.slug, `pricing-${plan.slug}`);
      } else {
        openBooking();
      }
    },
    [openBooking, openContact]
  );

  return (
    <section
      id="precios"
      className="relative z-[1] border-t border-[var(--mk-border-rule)] overflow-hidden"
      style={{ padding: "120px 24px" }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="mk-section-label mb-6">Planes</div>

        <h2 className="mk-section-heading mb-16">
          Elige el plan<br />
          que escala <em>contigo.</em>
        </h2>

        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ gap: "1px", background: "rgba(255,255,255,0.04)" }}
        >
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="relative"
              style={{
                background: plan.featured ? "#181818" : "var(--mk-bg)",
                padding: "40px 36px",
                outline: plan.featured ? "1px solid rgba(184,151,58,0.28)" : "none",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute font-ui text-[8px] font-bold tracking-[0.18em] uppercase"
                  style={{
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--mk-accent)",
                    color: "var(--mk-bg)",
                    padding: "5px 16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <div
                className="font-ui text-[10px] font-bold tracking-[0.2em] uppercase mb-5"
                style={{ color: "rgba(244,240,232,0.4)" }}
              >
                {plan.name}
              </div>

              {/* Price */}
              <div className="font-heading leading-none mb-1" style={{ fontSize: plan.pricePrefix ? 52 : 36, fontWeight: 300, color: "var(--mk-text-primary)", paddingTop: plan.pricePrefix ? 0 : 8 }}>
                {plan.pricePrefix && (
                  <span style={{ fontSize: 18, color: "rgba(244,240,232,0.4)" }}>{plan.pricePrefix}</span>
                )}
                {plan.price}
              </div>

              {/* Period */}
              <div
                className="text-[9px] tracking-[0.1em] mb-8"
                style={{ color: "rgba(244,240,232,0.3)" }}
              >
                {plan.period}
              </div>

              {/* Features */}
              <ul className="mb-8" style={{ listStyle: "none", padding: 0 }}>
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-baseline gap-2.5 text-[11px]"
                    style={{
                      padding: "9px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      color: f.on ? "rgba(244,240,232,0.8)" : "rgba(244,240,232,0.5)",
                    }}
                  >
                    <span style={{ color: "var(--mk-accent)", flexShrink: 0 }}>·</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.featured ? (
                <div className="relative">
                  {/* Pulsing glow ring for featured plan */}
                  <div
                    className="absolute inset-0 rounded-[12px]"
                    style={{
                      background: "transparent",
                      boxShadow: "0 0 0 0 rgba(184,151,58,0.7)",
                      animation: "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                  <button
                    onClick={() => handlePlanClick(plan)}
                    className="btn-mk-primary relative z-[1]"
                    style={{ display: "block", width: "100%", textAlign: "center", fontSize: 10, fontWeight: 700 }}
                  >
                    {plan.ctaLabel} →
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePlanClick(plan)}
                  className="btn-mk-outline"
                  style={{ display: "block", width: "100%", textAlign: "center", fontSize: 10 }}
                >
                  {plan.ctaLabel}
                </button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Trust elements below pricing */}
        <div className="text-center mt-12">
          {/* Urgency badge */}
          <div
            className="inline-flex items-center gap-2 mb-6"
            style={{
              background: "rgba(184,151,58,0.08)",
              border: "1px solid rgba(184,151,58,0.2)",
              padding: "8px 20px",
              borderRadius: "8px",
            }}
          >
            <span style={{ fontSize: 16 }}>⏰</span>
            <span
              className="font-ui text-[10px] tracking-[0.12em] uppercase"
              style={{ color: "var(--mk-accent)" }}
            >
              Últimas 3 demos disponibles esta semana
            </span>
          </div>

          {/* Trust micro-copy */}
          <div className="flex items-center justify-center gap-6 flex-wrap text-[11px]" style={{ color: "rgba(244,240,232,0.3)" }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Implementación asistida incluida
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Sin compromiso · Cancela cuando quieras
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              Soporte 24/7
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes pulse-ring {
            0% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0.7);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(184,151,58,0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(184,151,58,0);
            }
          }
        `}</style>
      </div>
    </section>
  );
}
