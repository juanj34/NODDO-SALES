"use client";

import { cn } from "@/lib/utils";

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgressBar({ currentStep, totalSteps }: WizardProgressBarProps) {
  return (
    <div className="flex gap-1.5 px-7 pt-5 pb-0">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] flex-1 rounded-full transition-colors duration-300",
            i <= currentStep
              ? "bg-[var(--noddo-primary)]"
              : "bg-white/8"
          )}
        />
      ))}
    </div>
  );
}
