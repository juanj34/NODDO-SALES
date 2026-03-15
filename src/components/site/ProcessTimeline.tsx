"use client";

import { LucideIcon, Mail, Phone, Calendar, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineStep {
  icon: LucideIcon;
  label: string;
  description: string;
  day: string;
}

interface ProcessTimelineProps {
  steps: TimelineStep[];
  className?: string;
  variant?: "horizontal" | "vertical";
}

export function ProcessTimeline({
  steps,
  className = "",
  variant = "horizontal",
}: ProcessTimelineProps) {
  if (variant === "vertical") {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              className="flex gap-4"
            >
              {/* Icon + Connector */}
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[rgba(var(--site-primary-rgb),0.12)] border border-[rgba(var(--site-primary-rgb),0.3)]">
                  <Icon size={18} className="text-[var(--site-primary)]" />
                </div>
                {!isLast && (
                  <div className="w-px h-full mt-2 bg-gradient-to-b from-[rgba(var(--site-primary-rgb),0.3)] to-transparent" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <p className="text-[10px] uppercase tracking-wider text-[var(--site-primary)] font-medium mb-1">
                  {step.day}
                </p>
                <p className="text-sm font-medium text-white mb-1">
                  {step.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`hidden lg:flex items-center justify-between gap-3 ${className}`}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="flex items-center flex-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              className="flex flex-col items-center text-center flex-1"
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full glass-light border border-[rgba(var(--site-primary-rgb),0.2)] mb-3">
                <Icon size={20} className="text-[var(--site-primary)]" />
              </div>

              {/* Day */}
              <p className="text-[10px] uppercase tracking-wider text-[var(--site-primary)] font-medium mb-1.5">
                {step.day}
              </p>

              {/* Label */}
              <p className="text-xs font-medium text-white mb-1">
                {step.label}
              </p>

              {/* Description */}
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                {step.description}
              </p>
            </motion.div>

            {/* Arrow connector */}
            {!isLast && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 + 0.2, duration: 0.3 }}
                className="mx-2 mt-[-80px]"
              >
                <ArrowRight
                  size={16}
                  className="text-[rgba(var(--site-primary-rgb),0.4)]"
                />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Predefined timeline presets for common flows
export const timelinePresets = {
  contactFlow: (t: (key: string) => string): TimelineStep[] => [
    {
      icon: Mail,
      day: t("site.timeline.today"),
      label: t("site.timeline.step1"),
      description: "Completas el formulario con tus datos",
    },
    {
      icon: Phone,
      day: t("site.timeline.tomorrow"),
      label: t("site.timeline.step2"),
      description: "Un asesor se comunica contigo",
    },
    {
      icon: Calendar,
      day: t("site.timeline.thisWeek"),
      label: t("site.timeline.step3"),
      description: "Coordinan visita al proyecto",
    },
    {
      icon: FileText,
      day: t("site.timeline.nextWeek"),
      label: t("site.timeline.step4"),
      description: "Recibes cotización personalizada",
    },
  ],
  cotizadorFlow: (t: (key: string) => string): TimelineStep[] => [
    {
      icon: FileText,
      day: t("site.timeline.now"),
      label: "Genera cotización",
      description: "PDF con plan de pagos detallado",
    },
    {
      icon: Mail,
      day: t("site.timeline.fiveMin"),
      label: "Recibes email",
      description: "Copia del PDF en tu correo",
    },
    {
      icon: Phone,
      day: t("site.timeline.tomorrow"),
      label: "Asesor te contacta",
      description: "Resuelve tus dudas personalmente",
    },
  ],
};
