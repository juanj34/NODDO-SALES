"use client";

interface HelpStepListProps {
  steps: readonly string[];
}

export function HelpStepList({ steps }: HelpStepListProps) {
  return (
    <ol className="relative space-y-0 ml-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-4 group">
          {/* Vertical line + number circle */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-ui shrink-0"
              style={{
                background: `rgba(var(--site-primary-rgb), 0.15)`,
                color: "var(--site-primary)",
                boxShadow: `0 0 0 1px rgba(var(--site-primary-rgb), 0.25)`,
              }}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div
                className="w-px flex-1 min-h-4"
                style={{
                  background: `rgba(var(--site-primary-rgb), 0.12)`,
                }}
              />
            )}
          </div>

          {/* Step text */}
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed pb-5 pt-0.5">
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}
