"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  id: string;
  label: string;
  title?: string;
  subtitle?: string;
}

interface MultiStepFormProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  canGoNext?: boolean;
  canGoPrev?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  showNavigation?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  className?: string;
}

export function MultiStepForm({
  steps,
  currentStep,
  onStepChange,
  children,
  canGoNext = true,
  canGoPrev = true,
  onNext,
  onPrev,
  showNavigation = true,
  nextLabel = "Continuar",
  prevLabel = "Atrás",
  className = "",
}: MultiStepFormProps) {
  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    if (canGoNext && currentStep < steps.length - 1) {
      if (onNext) {
        onNext();
      } else {
        onStepChange(currentStep + 1);
      }
    }
  };

  const handlePrev = () => {
    if (canGoPrev && currentStep > 0) {
      if (onPrev) {
        onPrev();
      } else {
        onStepChange(currentStep - 1);
      }
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Progress Bar */}
      <div className="space-y-3">
        {/* Progress Track */}
        <div className="relative h-1 bg-[var(--surface-2)] rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--site-primary)] to-[rgba(var(--site-primary-rgb),0.6)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const isFuture = index > currentStep;

            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Circle */}
                  <motion.div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-colors ${
                      isActive
                        ? "border-[var(--site-primary)] bg-[var(--site-primary)] text-[#0A0A0B]"
                        : isCompleted
                        ? "border-[var(--site-primary)] bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-1)] text-[var(--text-muted)]"
                    }`}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {index + 1}
                  </motion.div>

                  {/* Label */}
                  <p
                    className={`text-[10px] mt-1.5 text-center transition-colors ${
                      isActive
                        ? "text-[var(--site-primary)] font-medium"
                        : isCompleted
                        ? "text-[var(--text-secondary)]"
                        : "text-[var(--text-muted)]"
                    }`}
                  >
                    {s.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Title */}
      {step.title && (
        <motion.div
          key={`title-${currentStep}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <h3 className="text-lg font-medium text-white mb-1">{step.title}</h3>
          {step.subtitle && (
            <p className="text-sm text-[var(--text-secondary)]">
              {step.subtitle}
            </p>
          )}
        </motion.div>
      )}

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons (Optional) */}
      {showNavigation && (
        <div className="flex items-center gap-3 pt-2">
          {currentStep > 0 && (
            <motion.button
              type="button"
              onClick={handlePrev}
              disabled={!canGoPrev}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-ghost flex items-center gap-2 px-4 py-2.5 text-sm"
            >
              <ChevronLeft size={16} />
              {prevLabel}
            </motion.button>
          )}

          <div className="flex-1" />

          {currentStep < steps.length - 1 && (
            <motion.button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-warm flex items-center gap-2 px-6 py-2.5 text-sm tracking-[0.2em] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {nextLabel}
              <ChevronRight size={16} />
            </motion.button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper hook for managing multi-step form state
export function useMultiStepForm(totalSteps: number) {
  const [currentStep, setCurrentStep] = useState(0);

  const goToStep = (step: number) => {
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    reset,
    isFirstStep,
    isLastStep,
  };
}
