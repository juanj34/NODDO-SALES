"use client";

import { cn } from "@/lib/utils";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

interface NoddoBadgeProps {
  hide?: boolean;
  className?: string;
}

export function NoddoBadge({ hide, className }: NoddoBadgeProps) {
  if (hide) return null;

  return (
    <a
      href="https://noddo.io"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-3 right-3 z-30",
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
        "bg-black/40 backdrop-blur-md border border-white/[0.06]",
        "opacity-20 hover:opacity-50 transition-all duration-300",
        "no-underline",
        className
      )}
    >
      <span className="text-[7px] tracking-[0.12em] uppercase text-[var(--text-tertiary)]">
        by
      </span>
      <NodDoLogo width={38} colorNod="var(--text-secondary)" colorDo="#b8983c" />
    </a>
  );
}
