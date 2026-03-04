"use client";

import { motion } from "framer-motion";

interface SectionTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionTransition({ children, className }: SectionTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
