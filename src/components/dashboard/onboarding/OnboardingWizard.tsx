"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Rocket,
  FolderPlus,
  Layers,
  TableProperties,
  Download,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslation } from "@/i18n";

const STORAGE_KEY = "noddo_onboarding_done";

interface OnboardingWizardProps {
  onDismiss: () => void;
}

interface StepConfig {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  detailsKey?: string;
}

const STEPS: StepConfig[] = [
  {
    icon: <Rocket size={28} strokeWidth={1.5} />,
    titleKey: "onboarding.step1Title",
    descriptionKey: "onboarding.step1Desc",
    detailsKey: "onboarding.step1Details",
  },
  {
    icon: <FolderPlus size={28} strokeWidth={1.5} />,
    titleKey: "onboarding.step2Title",
    descriptionKey: "onboarding.step2Desc",
    detailsKey: "onboarding.step2Details",
  },
  {
    icon: <Layers size={28} strokeWidth={1.5} />,
    titleKey: "onboarding.step3Title",
    descriptionKey: "onboarding.step3Desc",
    detailsKey: "onboarding.step3Details",
  },
  {
    icon: <TableProperties size={28} strokeWidth={1.5} />,
    titleKey: "onboarding.step4Title",
    descriptionKey: "onboarding.step4Desc",
    detailsKey: "onboarding.step4Details",
  },
];

export function OnboardingWizard({ onDismiss }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { t } = useTranslation("dashboard");

  const handleNext = useCallback(() => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const handlePrev = useCallback(() => {
    if (step > 0) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleComplete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss();
  }, [onDismiss]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    onDismiss();
  }, [onDismiss]);

  const handleAction = useCallback(() => {
    switch (step) {
      case 1:
        // Go to project creator
        localStorage.setItem(STORAGE_KEY, "true");
        router.push("/proyectos?create=true");
        break;
      case 2:
        // Will be handled after project creation
        handleNext();
        break;
      case 3:
        // Complete onboarding
        handleComplete();
        break;
      default:
        handleNext();
    }
  }, [step, router, handleNext, handleComplete]);

  const current = STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        className="relative overflow-hidden rounded-[1.25rem] border border-[rgba(184,151,58,0.15)]"
        style={{
          background:
            "linear-gradient(to bottom, var(--surface-1), var(--surface-0))",
          boxShadow:
            "0 25px 50px -12px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(184,151,58,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Skip"
        >
          <X size={16} className="text-[var(--text-muted)]" />
        </button>

        <div className="relative z-10 px-8 py-10">
          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 rounded-full overflow-hidden bg-white/5"
              >
                <motion.div
                  className="h-full rounded-full"
                  initial={false}
                  animate={{
                    width: idx < step ? "100%" : idx === step ? "100%" : "0%",
                    backgroundColor:
                      idx <= step
                        ? "rgb(184, 151, 58)"
                        : "rgba(255,255,255,0.05)",
                  }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            ))}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <span className="text-[10px] font-ui uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {t("onboarding.stepOf", { current: step + 1, total: STEPS.length })}
            </span>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl bg-[rgba(184,151,58,0.10)] border border-[rgba(184,151,58,0.20)] flex items-center justify-center mb-5 text-[#b8973a]">
                {current.icon}
              </div>

              {/* Title */}
              <h2 className="text-2xl font-heading font-light text-white tracking-wide mb-3">
                {t(current.titleKey)}
              </h2>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4 max-w-lg">
                {t(current.descriptionKey)}
              </p>

              {/* Details */}
              {current.detailsKey && (
                <p className="text-xs text-[var(--text-tertiary)] leading-relaxed mb-6 max-w-lg">
                  {t(current.detailsKey)}
                </p>
              )}

              {/* Step-specific content */}
              {step === 0 && (
                <div className="flex flex-wrap gap-3 mb-6">
                  {[
                    { icon: <FolderPlus size={14} />, label: t("onboarding.feature1") },
                    { icon: <Layers size={14} />, label: t("onboarding.feature2") },
                    { icon: <TableProperties size={14} />, label: t("onboarding.feature3") },
                    { icon: <Sparkles size={14} />, label: t("onboarding.feature4") },
                  ].map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/3 border border-white/6 text-xs text-[var(--text-secondary)]"
                    >
                      <span className="text-[#b8973a]">{f.icon}</span>
                      {f.label}
                    </div>
                  ))}
                </div>
              )}

              {/* CSV download on step 4 */}
              {step === 3 && (
                <a
                  href="/templates/inventario-template.csv"
                  download="inventario-template.csv"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[0.75rem] bg-white/5 border border-white/10 text-sm text-[var(--text-secondary)] hover:bg-white/8 hover:border-white/15 transition-all mb-6"
                >
                  <Download size={14} className="text-[#b8973a]" />
                  {t("onboarding.downloadTemplate")}
                </a>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
            <button
              onClick={handlePrev}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
            >
              <ArrowLeft size={14} />
              {t("onboarding.prev")}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={step === 1 ? handleAction : handleNext}
                className="btn-warm px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {step === 1 ? t("onboarding.createProject") : t("onboarding.next")}
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="btn-warm px-6 py-2.5 text-sm flex items-center gap-2"
              >
                {t("onboarding.finish")}
                <Check size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
