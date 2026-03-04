"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useIsPortrait } from "@/hooks/useMediaQuery";
import { RotateCw } from "lucide-react";

export function RotateDevice() {
  const isPortrait = useIsPortrait();

  return (
    <AnimatePresence>
      {isPortrait && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--site-bg)] flex flex-col items-center justify-center gap-6 text-white"
        >
          <motion.div
            animate={{ rotate: 90 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          >
            <RotateCw size={64} strokeWidth={1} className="text-[var(--site-primary)]" />
          </motion.div>
          <p className="text-lg tracking-wider font-light">
            Gira tu dispositivo a modo horizontal
          </p>
          <p className="text-sm text-white/40">
            El modo vertical no es compatible
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
