"use client";

import { motion } from "framer-motion";
import { Lock, Sparkles, Check, MessageCircle, Mail } from "lucide-react";
import { useTranslation } from "@/i18n";
import {
  GATED_FEATURE_LABELS,
  PLAN_TIERS,
  type GatedFeature,
  type ProjectPlan,
} from "@/lib/plan-config";

interface PlanUpgradePromptProps {
  feature: GatedFeature;
  plan?: ProjectPlan;
}

/**
 * Full-page upgrade prompt shown when a user accesses a feature
 * that requires the Pro plan.
 */
export function PlanUpgradePrompt({ feature, plan = "basico" }: PlanUpgradePromptProps) {
  const { locale } = useTranslation("editor");
  const lang = locale === "en" ? "en" : "es";

  const featureLabel = GATED_FEATURE_LABELS[feature];
  const basicoTier = PLAN_TIERS.basico;
  const proTier = PLAN_TIERS.pro;

  const whatsappNumber = "573001234567"; // NODDO sales WhatsApp
  const whatsappMessage = encodeURIComponent(
    lang === "en"
      ? `Hi! I'm interested in upgrading to the Pro plan to access ${featureLabel.en}.`
      : `¡Hola! Me interesa actualizar al plan Pro para acceder a ${featureLabel.es}.`
  );

  const proFeatures = lang === "en"
    ? [
        "Integrated Quotation Tool with automatic PDF",
        "Branded emails with your company logo & colors",
        "Advanced analytics dashboard",
        `${proTier.storage_bytes / 1024 ** 3}GB storage`,
        `Up to ${proTier.max_collaborators} collaborators`,
      ]
    : [
        "Cotizador integrado con PDF automático",
        "Correos con logo y colores de tu constructora",
        "Estadísticas avanzadas con gráficos detallados",
        `${proTier.storage_bytes / 1024 ** 3}GB de almacenamiento`,
        `Hasta ${proTier.max_collaborators} colaboradores`,
      ];

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass-card max-w-lg w-full p-8 text-center"
      >
        {/* Lock icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(var(--site-primary-rgb), 0.08)",
            border: "1px solid rgba(var(--site-primary-rgb), 0.15)",
          }}
        >
          <Lock size={28} className="text-[var(--site-primary)]" />
        </div>

        {/* Feature name */}
        <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-2">
          {featureLabel[lang]}
        </h2>

        {/* Description */}
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed max-w-sm mx-auto">
          {lang === "en"
            ? `${featureLabel.description_en} Upgrade to the Pro plan to unlock this feature.`
            : `${featureLabel.description_es} Actualiza al plan Pro para desbloquear esta función.`}
        </p>

        {/* Plan comparison */}
        <div
          className="rounded-[1rem] p-5 mb-6 text-left"
          style={{
            background: "var(--surface-1)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-[var(--site-primary)]" />
            <span className="font-ui text-xs font-bold uppercase tracking-[0.12em] text-[var(--site-primary)]">
              Plan Pro — ${proTier.price}/mes
            </span>
          </div>

          <ul className="space-y-2.5">
            {proFeatures.map((feat) => (
              <li key={feat} className="flex items-start gap-2.5">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(34, 197, 94, 0.10)",
                    border: "1px solid rgba(34, 197, 94, 0.15)",
                  }}
                >
                  <Check size={10} strokeWidth={2.5} color="#22c55e" />
                </div>
                <span className="text-sm text-[var(--text-secondary)]">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-warm flex-1 py-3 text-sm inline-flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            <span className="font-ui text-xs font-bold uppercase tracking-[0.08em]">
              {lang === "en" ? "Contact Sales" : "Contactar Ventas"}
            </span>
          </a>
          <a
            href="mailto:hola@noddo.io?subject=Upgrade%20a%20Plan%20Pro"
            className="btn-outline-warm flex-1 py-3 text-sm inline-flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            <span className="font-ui text-xs font-bold uppercase tracking-[0.08em]">
              {lang === "en" ? "Email Us" : "Escribirnos"}
            </span>
          </a>
        </div>

        {/* Current plan note */}
        <p className="text-[11px] text-[var(--text-muted)] mt-4">
          {lang === "en"
            ? `Your current plan: ${basicoTier.name.en} ($${basicoTier.price}/mo)`
            : `Tu plan actual: ${basicoTier.name.es} ($${basicoTier.price}/mes)`}
        </p>
      </motion.div>
    </div>
  );
}
