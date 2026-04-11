"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, Building2, ChevronDown, Plus } from "lucide-react";
import { useBooking } from "@/components/marketing/BookingProvider";
import { useContact } from "@/components/marketing/ContactProvider";
import { trackPricingPlanClicked, trackPricingViewed } from "@/lib/marketing-tracking";
import { PLAN_VALUES } from "@/lib/ghl-config";
import { useTranslation } from "@/i18n";

/* ─── Animation helpers ─── */

const ease = [0.25, 0.46, 0.45, 0.94] as const;

function FadeInSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Types ─── */

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  icon: typeof Zap;
  name: string;
  slug: string;
  price: string | null;
  priceLabel: string;
  description: string;
  cta: string;
  ctaStyle: "primary" | "outline";
  highlighted: boolean;
  badge?: string;
  features: PlanFeature[];
}

interface FAQ {
  question: string;
  answer: string;
}

interface AddOn {
  name: string;
  description: string;
}

/* ─── Components ─── */

function FAQItem({ faq, index }: { faq: FAQ; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <FadeInSection delay={index * 0.06}>
      <div
        className="rounded-[1.25rem] overflow-hidden transition-colors duration-300"
        style={{
          background: "var(--mk-surface-3)",
          border: `1px solid ${open ? "var(--mk-border-rule)" : "var(--mk-border-subtle)"}`,
        }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-6 py-5 text-left cursor-pointer"
        >
          <span
            className="text-sm font-medium pr-4"
            style={{ color: "var(--mk-text-primary)" }}
          >
            {faq.question}
          </span>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex-shrink-0"
          >
            <ChevronDown
              size={18}
              style={{ color: "var(--mk-text-tertiary)" }}
            />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-5">
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--mk-text-secondary)" }}
                >
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeInSection>
  );
}

function PricingCard({
  plan,
  index,
  onCtaClick,
}: {
  plan: Plan;
  index: number;
  onCtaClick: () => void;
}) {
  const Icon = plan.icon;

  return (
    <FadeInSection delay={index * 0.12}>
      <div
        className="relative h-full flex flex-col rounded-[1.25rem] p-7 transition-all duration-400"
        style={{
          background: "var(--mk-surface-3)",
          border: plan.highlighted
            ? "1px solid rgba(var(--mk-accent-rgb), 0.3)"
            : "1px solid var(--mk-border-subtle)",
          boxShadow: plan.highlighted
            ? "var(--mk-shadow-md)"
            : "var(--mk-shadow-sm)",
        }}
      >
        {/* Popular badge */}
        {plan.badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span
              className="text-xs font-semibold px-5 py-1.5 rounded-full whitespace-nowrap"
              style={{
                background: "var(--mk-accent)",
                color: "#141414",
                boxShadow: "0 4px 16px rgba(var(--mk-accent-rgb), 0.3)",
              }}
            >
              {plan.badge}
            </span>
          </div>
        )}

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
          style={{
            background: "rgba(var(--mk-accent-rgb), 0.08)",
            border: "1px solid rgba(var(--mk-accent-rgb), 0.12)",
          }}
        >
          <Icon size={22} style={{ color: "var(--mk-accent)" }} />
        </div>

        {/* Name */}
        <h3
          className="text-lg font-semibold tracking-wide mb-2"
          style={{ color: "var(--mk-text-primary)" }}
        >
          {plan.name}
        </h3>

        {/* Price */}
        <div className="mb-4">
          {plan.price ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold tracking-tight"
                style={{ color: "var(--mk-text-primary)" }}
              >
                {plan.price}
              </span>
              <span
                className="text-sm"
                style={{ color: "var(--mk-text-tertiary)" }}
              >
                {plan.priceLabel}
              </span>
            </div>
          ) : (
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: "var(--mk-text-primary)" }}
            >
              {plan.priceLabel}
            </span>
          )}
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--mk-text-tertiary)" }}
        >
          {plan.description}
        </p>

        {/* CTA Button */}
        <button
          onClick={onCtaClick}
          className={`${
            plan.ctaStyle === "primary" ? "btn-mk-primary" : "btn-mk-outline"
          } w-full py-3 text-sm tracking-[0.08em] text-center inline-flex items-center justify-center mb-8`}
        >
          {plan.cta}
        </button>

        {/* Divider */}
        <div
          className="h-px mb-6"
          style={{ background: "var(--mk-border-subtle)" }}
        />

        {/* Features list */}
        <ul className="space-y-3.5 flex-1">
          {plan.features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3">
              {feature.included ? (
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(34, 197, 94, 0.10)",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <Check size={12} strokeWidth={2.5} color="#22c55e" />
                </div>
              ) : (
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid var(--mk-border-subtle)",
                  }}
                >
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--mk-text-muted)" }}
                  >
                    —
                  </span>
                </div>
              )}
              <span
                className="text-sm"
                style={{
                  color: feature.included
                    ? "var(--mk-text-secondary)"
                    : "var(--mk-text-muted)",
                }}
              >
                {feature.text}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </FadeInSection>
  );
}

/* ─── Page ─── */

export default function PricingPage() {
  const { openBooking } = useBooking();
  const { openContact } = useContact();
  const { t } = useTranslation("marketing");

  // Track pricing page view on mount
  useState(() => {
    trackPricingViewed();
  });

  const plans: Plan[] = [
    {
      icon: Zap,
      name: t("pricing.plans.basicoName"),
      slug: "basico",
      price: `$${t("pricing.plans.basicoPrice")}`,
      priceLabel: t("pricing.plans.basicoPeriod"),
      description: t("pricing.plans.basicoDesc"),
      cta: t("pricing.plans.basicoCta"),
      ctaStyle: "outline",
      highlighted: false,
      features: [
        { text: t("pricing.plans.basicoF0"), included: true },
        { text: t("pricing.plans.basicoF1"), included: true },
        { text: t("pricing.plans.basicoF2"), included: true },
        { text: t("pricing.plans.basicoF3"), included: true },
        { text: t("pricing.plans.basicoF4"), included: true },
        { text: t("pricing.plans.basicoX0"), included: false },
        { text: t("pricing.plans.basicoX1"), included: false },
        { text: t("pricing.plans.basicoX2"), included: false },
      ],
    },
    {
      icon: Sparkles,
      name: t("pricing.plans.proName"),
      slug: "pro",
      price: `$${t("pricing.plans.proPrice")}`,
      priceLabel: t("pricing.plans.proPeriod"),
      description: t("pricing.plans.proDesc"),
      cta: t("pricing.plans.proCta"),
      ctaStyle: "primary",
      highlighted: true,
      badge: t("pricing.plans.proBadge"),
      features: [
        { text: t("pricing.plans.proF0"), included: true },
        { text: t("pricing.plans.proF1"), included: true },
        { text: t("pricing.plans.proF2"), included: true },
        { text: t("pricing.plans.proF3"), included: true },
      ],
    },
    {
      icon: Building2,
      name: t("pricing.plans.personalizadoName"),
      slug: "personalizado",
      price: null,
      priceLabel: t("pricing.plans.personalizadoPrice"),
      description: t("pricing.plans.personalizadoDesc"),
      cta: t("pricing.plans.personalizadoCta"),
      ctaStyle: "outline",
      highlighted: false,
      features: [
        { text: t("pricing.plans.personalizadoF0"), included: true },
        { text: t("pricing.plans.personalizadoF1"), included: true },
        { text: t("pricing.plans.personalizadoF2"), included: true },
        { text: t("pricing.plans.personalizadoF3"), included: true },
        { text: t("pricing.plans.personalizadoF4"), included: true },
      ],
    },
  ];

  const addOns: AddOn[] = [
    {
      name: t("pricing.addOns.a0name"),
      description: t("pricing.addOns.a0desc"),
    },
    {
      name: t("pricing.addOns.a1name"),
      description: t("pricing.addOns.a1desc"),
    },
    {
      name: t("pricing.addOns.a2name"),
      description: t("pricing.addOns.a2desc"),
    },
  ];

  const faqs: FAQ[] = [
    { question: t("pricing.faq.q0"), answer: t("pricing.faq.a0") },
    { question: t("pricing.faq.q1"), answer: t("pricing.faq.a1") },
    { question: t("pricing.faq.q2"), answer: t("pricing.faq.a2") },
    { question: t("pricing.faq.q3"), answer: t("pricing.faq.a3") },
    { question: t("pricing.faq.q4"), answer: t("pricing.faq.a4") },
    { question: t("pricing.faq.q5"), answer: t("pricing.faq.a5") },
    { question: t("pricing.faq.q6"), answer: t("pricing.faq.a6") },
  ];

  const handlePlanCTA = (plan: Plan) => {
    trackPricingPlanClicked(plan.slug, PLAN_VALUES[plan.slug] || 249);
    if (plan.slug === "personalizado") {
      openContact("personalizado", "pricing-personalizado");
    } else {
      openBooking();
    }
  };

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--mk-bg)", color: "var(--mk-text-primary)" }}
    >
      {/* ─── Header Section ─── */}
      <section className="relative pt-20 sm:pt-32 pb-16 px-6">
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-xs tracking-[0.4em] uppercase mb-5"
            style={{ color: "var(--mk-accent)" }}
          >
            {t("pricing.headerLabel")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="font-heading text-4xl md:text-6xl font-light tracking-wider mb-5"
            style={{ color: "var(--mk-text-primary)" }}
          >
            {t("pricing.headerHeading")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="text-base md:text-lg leading-relaxed"
            style={{ color: "var(--mk-text-tertiary)" }}
          >
            {t("pricing.headerSubtitle")}
          </motion.p>
        </div>
      </section>

      {/* ─── Pricing Cards ─── */}
      <section className="relative px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                index={i}
                onCtaClick={() => handlePlanCTA(plan)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Add-ons Section ─── */}
      <section className="relative px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <FadeInSection className="text-center mb-10">
            <p
              className="text-xs tracking-[0.4em] uppercase mb-4"
              style={{ color: "var(--mk-accent)" }}
            >
              {t("pricing.addOns.label")}
            </p>
            <h2
              className="font-heading text-2xl md:text-4xl font-light tracking-wider"
              style={{ color: "var(--mk-text-primary)" }}
            >
              {t("pricing.addOns.heading")}
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addOns.map((addon, i) => (
              <FadeInSection key={addon.name} delay={i * 0.08}>
                <div
                  className="rounded-[1.25rem] p-6 h-full"
                  style={{
                    background: "var(--mk-surface-3)",
                    border: "1px solid var(--mk-border-subtle)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(var(--mk-accent-rgb), 0.08)",
                        border: "1px solid rgba(var(--mk-accent-rgb), 0.12)",
                      }}
                    >
                      <Plus size={16} style={{ color: "var(--mk-accent)" }} />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold mb-1.5"
                        style={{ color: "var(--mk-text-primary)" }}
                      >
                        {addon.name}
                      </h3>
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--mk-text-tertiary)" }}
                      >
                        {addon.description}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Implementation note */}
          <FadeInSection delay={0.3}>
            <p
              className="text-center text-sm italic mt-8"
              style={{ color: "var(--mk-text-muted)", maxWidth: 560, margin: "32px auto 0" }}
            >
              {t("pricing.implementation")}
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section className="relative py-32 px-6">
        <div className="relative z-10 max-w-2xl mx-auto">
          <FadeInSection className="text-center mb-14">
            <h2
              className="font-heading text-3xl md:text-5xl font-light tracking-wider"
              style={{ color: "var(--mk-text-primary)" }}
            >
              {t("pricing.faq.heading")}
            </h2>
          </FadeInSection>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={faq.question} faq={faq} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section
        className="relative py-32 px-6 overflow-hidden"
        style={{ background: "var(--mk-bg-dark)" }}
      >
        <FadeInSection className="relative z-10 text-center max-w-xl mx-auto">
          <h2
            className="font-heading text-3xl md:text-5xl font-light tracking-wider mb-5"
            style={{ color: "var(--mk-text-primary)" }}
          >
            {t("pricing.cta.heading")}
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            {t("pricing.cta.subtitle")}
          </p>
          <button
            onClick={() => openBooking()}
            className="btn-mk-primary px-10 py-3.5 text-sm tracking-[0.12em] inline-flex items-center justify-center"
          >
            {t("pricing.cta.button")}
          </button>
        </FadeInSection>
      </section>
    </div>
  );
}
