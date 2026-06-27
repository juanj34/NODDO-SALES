"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CloseButtonProps {
  onClick: () => void;
  className?: string;
  size?: number;
  variant?: "glass" | "dark" | "subtle";
  showEsc?: boolean;
}

export function CloseButton({
  onClick,
  className,
  size = 16,
  variant = "dark",
  showEsc = true,
}: CloseButtonProps) {
  const variantStyles = {
    glass:
      "w-10 h-10 glass rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
    dark: "w-8 h-8 rounded-full bg-[var(--surface-3)] hover:bg-[var(--surface-4)] text-[var(--text-secondary)]",
    subtle:
      "rounded-lg p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={onClick}
        aria-label="Cerrar"
        className={cn(
          "flex items-center justify-center transition-colors cursor-pointer",
          variantStyles[variant],
        )}
      >
        <X size={size} />
      </button>
      {showEsc && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] tracking-widest text-[var(--text-muted)] uppercase select-none pointer-events-none">
          ESC
        </span>
      )}
    </div>
  );
}
