"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Zap, Building2, ChevronDown } from "lucide-react";
import { useBooking } from "@/components/marketing/BookingProvider";

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
  monthlyPrice: string | null;
  annualPrice: string | null;
  priceLabel: string;
  description: string;
  cta: string;
  ctaHref: string;
  ctaStyle: "primary" | "outline";
  highlighted: boolean;
  badge?: string;
  features: PlanFeature[];
}

interface FAQ {
  question: string;
  answer: string;
}

/* ─── Data ─── */

const plans: Plan[] = [
  {
    icon: Zap,
    name: "Basico",
    monthlyPrice: "$149.000",
    annualPrice: "$119.000",
    priceLabel: "COP/mes",
    description: "Para empezar con tu primer proyecto digital.",
    cta: "Comenzar gratis",
    ctaHref: "/login",
    ctaStyle: "outline",
    highlighted: false,
    features: [
      { text: "1 proyecto activo", included: true },
      { text: "Galeria de imagenes", included: true },
      { text: "Formulario de contacto", included: true },
      { text: "Subdominio gratuito", included: true },
      { text: "Soporte por email", included: true },
      { text: "Mapas interactivos", included: false },
      { text: "Videos integrados", included: false },
      { text: "Fachadas interactivas", included: false },
      { text: "Dominio personalizado", included: false },
      { text: "Asistencia de IA", included: false },
    ],
  },
  {
    icon: Sparkles,
    name: "Profesional",
    monthlyPrice: "$349.000",
    annualPrice: "$279.000",
    priceLabel: "COP/mes",
    description: "Todo lo que necesitas para vender mas rapido.",
    cta: "Comenzar ahora",
    ctaHref: "/login",
    ctaStyle: "primary",
    highlighted: true,
    badge: "Mas Popular",
    features: [
      { text: "5 proyectos activos", included: true },
      { text: "Todo del plan Basico", included: true },
      { text: "Mapas interactivos con POIs", included: true },
      { text: "Videos de YouTube integrados", included: true },
      { text: "Fachadas interactivas multi-torre", included: true },
      { text: "Dominio personalizado", included: true },
      { text: "Inventario de unidades", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Proyectos ilimitados", included: false },
      { text: "Asistencia de IA", included: false },
    ],
  },
  {
    icon: Building2,
    name: "Empresarial",
    monthlyPrice: null,
    annualPrice: null,
    priceLabel: "",
    description: "Para constructoras con multiples proyectos.",
    cta: "Contactar ventas",
    ctaHref: "mailto:hola@noddo.co",
    ctaStyle: "outline",
    highlighted: false,
    features: [
      { text: "Proyectos ilimitados", included: true },
      { text: "Todo del plan Profesional", included: true },
      { text: "Asistencia de IA para contenido", included: true },
      { text: "Importacion masiva CSV", included: true },
      { text: "Multi-usuario y roles", included: true },
      { text: "API de integracion", included: true },
      { text: "SLA garantizado", included: true },
      { text: "Soporte dedicado 24/7", included: true },
    ],
  },
];

const faqs: FAQ[] = [
  {
    question: "¿Puedo cambiar de plan en cualquier momento?",
    answer:
      "Si, puedes actualizar o degradar tu plan en cualquier momento. Los cambios se aplican inmediatamente y se ajusta el cobro de forma proporcional.",
  },
  {
    question: "¿Que metodos de pago aceptan?",
    answer:
      "Aceptamos tarjetas de credito y debito (Visa, Mastercard, American Express). Para planes empresariales ofrecemos facturacion directa.",
  },
  {
    question: "¿Hay algun contrato o permanencia minima?",
    answer:
      "No, todos nuestros planes son mes a mes sin clausulas de permanencia. Puedes cancelar cuando quieras sin penalidades.",
  },
  {
    question: "¿Que pasa con mis datos si cancelo?",
    answer:
      "Tus proyectos y datos se mantienen disponibles por 30 dias despues de cancelar. Puedes exportar toda tu informacion en cualquier momento.",
  },
  {
    question: "¿Ofrecen descuentos por volumen?",
    answer:
      "Si, para constructoras con mas de 10 proyectos ofrecemos descuentos especiales. Contacta a nuestro equipo de ventas para una cotizacion personalizada.",
  },
];

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
  annual,
  index,
  onCtaClick,
}: {
  plan: Plan;
  annual: boolean;
  index: number;
  onCtaClick: () => void;
}) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
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
          {price ? (
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-3xl font-bold tracking-tight"
                style={{ color: "var(--mk-text-primary)" }}
              >
                {price}
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
              Personalizado
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
                  <X
                    size={12}
                    strokeWidth={2.5}
                    style={{ color: "var(--mk-text-muted)" }}
                  />
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
  const [annual, setAnnual] = useState(false);
  const { openBooking } = useBooking();

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ background: "var(--mk-bg)", color: "var(--mk-text-primary)" }}
    >
      {/* ─── Header Section ─── */}
      <section className="relative pt-32 pb-16 px-6">
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-xs tracking-[0.4em] uppercase mb-5"
            style={{ color: "var(--mk-accent)" }}
          >
            Precios simples, resultados extraordinarios
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="font-heading text-4xl md:text-6xl font-light tracking-wider mb-5"
            style={{ color: "var(--mk-text-primary)" }}
          >
            Elige tu plan
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
            className="text-base md:text-lg leading-relaxed"
            style={{ color: "var(--mk-text-tertiary)" }}
          >
            Sin costos ocultos. Cancela cuando quieras.
          </motion.p>
        </div>
      </section>

      {/* ─── Monthly / Annual Toggle ─── */}
      <section className="relative pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease }}
          className="flex justify-center"
        >
          <div
            className="inline-flex items-center rounded-full p-1 relative"
            style={{ background: "var(--mk-surface-2)" }}
          >
            <button
              onClick={() => setAnnual(false)}
              className="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 cursor-pointer"
              style={{
                color: !annual ? "white" : "var(--mk-text-tertiary)",
                background: !annual ? "var(--mk-text-primary)" : "transparent",
              }}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className="relative z-10 px-6 py-2 text-sm font-medium rounded-full transition-colors duration-300 flex items-center gap-2 cursor-pointer"
              style={{
                color: annual ? "white" : "var(--mk-text-tertiary)",
                background: annual ? "var(--mk-text-primary)" : "transparent",
              }}
            >
              Anual
              {annual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(255, 255, 255, 0.20)",
                    color: "white",
                  }}
                >
                  -20%
                </motion.span>
              )}
            </button>
          </div>
        </motion.div>
      </section>

      {/* ─── Pricing Cards ─── */}
      <section className="relative px-6 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan, i) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                annual={annual}
                index={i}
                onCtaClick={openBooking}
              />
            ))}
          </div>
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
              Preguntas frecuentes
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
            ¿Necesitas algo diferente?
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed mb-10"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            Contactanos para un plan a tu medida.
          </p>
          <button
            onClick={openBooking}
            className="btn-mk-primary px-10 py-3.5 text-sm tracking-[0.12em] inline-flex items-center justify-center"
          >
            Contactar ventas
          </button>
        </FadeInSection>
      </section>
    </div>
  );
}
