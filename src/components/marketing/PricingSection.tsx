"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useBooking } from "./BookingProvider";
import { useContact } from "./ContactProvider";
import { trackPricingPlanClicked } from "@/lib/marketing-tracking";
import { PLAN_VALUES } from "@/lib/ghl-config";
import { useTranslation } from "@/i18n";

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

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export function PricingSection() {
  const { openBooking } = useBooking();
  const { openContact } = useContact();
  const { t } = useTranslation("marketing");

  const plans: Plan[] = [
    {
      name: t("pricing.plans.basicoName"),
      slug: "basico",
      pricePrefix: "$",
      price: t("pricing.plans.basicoPrice"),
      period: t("pricing.plans.basicoPeriod"),
      features: [
        { text: t("pricing.plans.basicoF0"), on: true },
        { text: t("pricing.plans.basicoF1"), on: true },
        { text: t("pricing.plans.basicoF2"), on: true },
        { text: t("pricing.plans.basicoF3"), on: true },
        { text: t("pricing.plans.basicoF4"), on: true },
      ],
      ctaLabel: t("pricing.plans.basicoCta"),
      ctaAction: "booking",
    },
    {
      name: t("pricing.plans.proName"),
      slug: "pro",
      pricePrefix: "$",
      price: t("pricing.plans.proPrice"),
      period: t("pricing.plans.proPeriod"),
      featured: true,
      badge: t("pricing.plans.proBadge"),
      features: [
        { text: t("pricing.plans.proF0"), on: true },
        { text: t("pricing.plans.proF1"), on: true },
        { text: t("pricing.plans.proF2"), on: true },
        { text: t("pricing.plans.proF3"), on: true },
      ],
      ctaLabel: t("pricing.plans.proCta"),
      ctaAction: "booking",
    },
    {
      name: t("pricing.plans.personalizadoName"),
      slug: "personalizado",
      price: t("pricing.plans.personalizadoPrice"),
      period: t("pricing.plans.personalizadoPeriod"),
      features: [
        { text: t("pricing.plans.personalizadoF0"), on: true },
        { text: t("pricing.plans.personalizadoF1"), on: true },
        { text: t("pricing.plans.personalizadoF2"), on: true },
        { text: t("pricing.plans.personalizadoF3"), on: true },
        { text: t("pricing.plans.personalizadoF4"), on: true },
      ],
      ctaLabel: t("pricing.plans.personalizadoCta"),
      ctaAction: "contact",
    },
  ];

  const addOns = [
    { name: t("pricing.addOns.a0name"), desc: t("pricing.addOns.a0desc") },
    { name: t("pricing.addOns.a1name"), desc: t("pricing.addOns.a1desc") },
    { name: t("pricing.addOns.a2name"), desc: t("pricing.addOns.a2desc") },
  ];

  const handlePlanClick = useCallback(
    (plan: Plan) => {
      trackPricingPlanClicked(plan.slug, PLAN_VALUES[plan.slug] || 249);
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
      className="relative z-[1] border-t border-[var(--mk-border-rule)] overflow-hidden py-20 px-4 sm:py-24 sm:px-6 lg:py-[120px] lg:px-6"
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="mk-section-label mb-6">{t("pricing.label")}</div>

        <h2 className="mk-section-heading mb-16">
          {t("pricing.heading")}<br />
          <em>{t("pricing.headingEmphasis")}</em>
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
              className="relative p-6 sm:p-8 lg:p-[40px_36px]"
              style={{
                background: plan.featured ? "#181818" : "var(--mk-bg)",
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
              <div className="font-heading leading-none mb-1" style={{ fontSize: plan.pricePrefix ? "clamp(36px,10vw,52px)" : "clamp(28px,8vw,36px)", fontWeight: 300, color: "var(--mk-text-primary)", paddingTop: plan.pricePrefix ? 0 : 8 }}>
                {plan.pricePrefix && (
                  <span style={{ fontSize: 18, color: "rgba(244,240,232,0.4)" }}>{plan.pricePrefix}</span>
                )}
                {plan.price}
              </div>

              {/* Period */}
              <div
                className="text-[10px] tracking-[0.1em] mb-8"
                style={{ color: "rgba(244,240,232,0.3)" }}
              >
                {plan.period}
              </div>

              {/* Features */}
              <ul className="mb-8" style={{ listStyle: "none", padding: 0 }}>
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-baseline gap-2.5 text-[12px]"
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

        {/* Add-ons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mt-12"
        >
          <div
            className="font-ui text-[9px] font-bold tracking-[0.2em] uppercase mb-5 text-center"
            style={{ color: "rgba(244,240,232,0.35)" }}
          >
            {t("pricing.addOns.label")}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
            {addOns.map((addon) => (
              <div
                key={addon.name}
                className="flex items-start gap-3 p-5"
                style={{ background: "var(--mk-bg)" }}
              >
                <Plus size={14} style={{ color: "var(--mk-accent)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div className="text-[12px] font-medium" style={{ color: "rgba(244,240,232,0.8)" }}>
                    {addon.name}
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: "rgba(244,240,232,0.35)" }}>
                    {addon.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Implementation note */}
        <div className="text-center mt-8 mb-10">
          <p className="text-[11px] italic" style={{ color: "rgba(244,240,232,0.3)", maxWidth: 500, margin: "0 auto" }}>
            {t("pricing.implementation")}
          </p>
        </div>

        {/* Trust elements below pricing */}
        <div className="text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-[12px]" style={{ color: "rgba(244,240,232,0.3)" }}>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("pricing.trustItems.t0")}
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("pricing.trustItems.t1")}
            </div>
            <div className="flex items-center gap-1.5">
              <span style={{ color: "var(--mk-accent)" }}>✓</span>
              {t("pricing.trustItems.t2")}
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
