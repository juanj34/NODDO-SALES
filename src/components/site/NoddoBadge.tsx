"use client";

import { cn } from "@/lib/utils";
import { NodDoLogo } from "@/components/ui/NodDoLogo";

interface NoddoBadgeProps {
  className?: string;
}

export function NoddoBadge({ className }: NoddoBadgeProps) {
  return (
    <a
      href="https://noddo.io"
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl",
        "bg-white/[0.03] backdrop-blur-xl border border-white/[0.05]",
        "opacity-30 hover:opacity-60 transition-all duration-300",
        "no-underline",
        className
      )}
    >
      <span className="text-[7px] tracking-[0.2em] uppercase font-medium text-white/50">
        powered by
      </span>
      <NodDoLogo width={70} colorNod="#fff" colorDo="#b8983c" />
    </a>
  );
}
