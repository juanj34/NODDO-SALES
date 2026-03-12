"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useIsPortrait } from "@/hooks/useMediaQuery";
import { RotateCw } from "lucide-react";
import { useTranslation } from "@/i18n";

export function RotateDevice() {
  const isPortrait = useIsPortrait();
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation("common");

  return (
    <AnimatePresence>
      {isPortrait && !dismissed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--site-bg)] flex flex-col items-center justify-center gap-6 text-white px-6"
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
          <p className="text-lg tracking-wider font-light text-center">
            {t("rotateDevice.message")}
          </p>
          <p className="text-sm text-white/40 text-center">
            {t("rotateDevice.subtitle")}
          </p>
          <button
            onClick={() => setDismissed(true)}
            className="mt-4 px-6 py-2.5 text-xs tracking-[0.08em] uppercase text-white/50 border border-white/10 rounded-lg hover:text-white/80 hover:border-white/20 transition-colors"
          >
            {t("rotateDevice.dismiss")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
