"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Check } from "lucide-react";
import type { Plan } from "@/lib/plan-limits";
import { FEATURE_LABELS, type Feature } from "@/lib/feature-access";

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  feature: Feature;
  currentPlan: Plan;
  requiredPlan: Plan;
  onUpgrade: () => void;
}

const PLAN_PRICES: Record<Plan, string> = {
  basic: "$79/mes",
  premium: "$149/mes",
  enterprise: "Desde $499/mes",
};

const PREMIUM_BENEFITS = [
  "Videos inmersivos (Cloudflare Stream)",
  "Mapas interactivos con POIs",
  "Fachadas interactivas",
  "Tours 360° (Matterport/Kuula)",
  "Analytics avanzado",
  "Dominio personalizado",
  "50GB de almacenamiento por proyecto",
  "Soporte prioritario (24-48h)",
];

const ENTERPRISE_BENEFITS = [
  "White-label completo (sin marca NODDO)",
  "API REST + Webhooks",
  "Importación CSV masiva",
  "Multi-usuario ilimitado",
  "Asistencia IA para contenido",
  "500GB de almacenamiento total",
  "Soporte 24/7 (chat/email)",
  "SLA 99.9%",
];

export function UpgradePrompt({
  isOpen,
  onClose,
  feature,
  currentPlan,
  requiredPlan,
  onUpgrade,
}: UpgradePromptProps) {
  const featureLabel = FEATURE_LABELS[feature]?.es || feature;
  const benefits = requiredPlan === "premium" ? PREMIUM_BENEFITS : ENTERPRISE_BENEFITS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-modal p-8 w-full max-w-lg space-y-6 relative overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 rounded-lg hover:bg-white/5"
            >
              <X size={18} />
            </button>

            {/* Icon */}
            <div className="flex justify-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(184,151,58,0.15), rgba(184,151,58,0.05))",
                  border: "1px solid rgba(184,151,58,0.25)",
                }}
              >
                <Sparkles size={28} className="text-[var(--site-primary)]" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center">
              <h2 className="font-heading text-2xl font-light text-[var(--text-primary)] mb-2">
                Desbloquea {featureLabel}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                Esta característica requiere plan{" "}
                <span className="text-[var(--site-primary)] font-medium capitalize">{requiredPlan}</span>
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <p className="text-xs font-ui font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Todo lo que obtienes con {requiredPlan}:
              </p>
              <ul className="space-y-2">
                {benefits.slice(0, 6).map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={16} className="text-[var(--site-primary)] shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="bg-[var(--surface-2)] border border-[var(--border-default)] rounded-xl p-4 text-center">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Precio</p>
              <p className="font-heading text-3xl font-light text-[var(--site-primary)]">
                {PLAN_PRICES[requiredPlan]}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Sin costos ocultos · Cancela cuando quieras</p>
            </div>

            {/* CTAs */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] border border-[var(--border-default)] rounded-[0.75rem] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={onUpgrade}
                className="flex-1 px-4 py-2.5 font-ui text-xs font-bold uppercase tracking-[0.1em] rounded-[0.75rem] flex items-center justify-center gap-2 bg-[var(--site-primary)] text-black hover:bg-[#d4b05a] transition-all"
              >
                Actualizar plan
                <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
