"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useTransform, animate, motion } from "framer-motion";

interface Props {
  target: number;
  duration?: number;
  suffix?: string;
  decimals?: number;
}

export function AnimatedCounter({ target, duration = 1.2, suffix, decimals = 0 }: Props) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    const num = decimals > 0
      ? v.toFixed(decimals)
      : Math.round(v).toLocaleString("es-CO");
    return num;
  });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current && target === 0) return;
    hasAnimated.current = true;
    const controls = animate(count, target, {
      duration,
      ease: "easeOut",
    });
    return () => controls.stop();
  }, [count, target, duration]);

  return (
    <span className="inline-flex items-baseline gap-0.5">
      <motion.span>{rounded}</motion.span>
      {suffix && (
        <span className="text-xs text-[var(--text-muted)] ml-0.5">{suffix}</span>
      )}
    </span>
  );
}
