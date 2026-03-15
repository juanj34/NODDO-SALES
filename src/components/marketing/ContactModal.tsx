"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContact } from "./ContactProvider";
import { ContactForm } from "./ContactForm";

export function ContactModal() {
  const { isContactOpen, closeContact, contactPlan, contactSource } = useContact();
  const [mountKey, setMountKey] = useState(0);

  // Lock body scroll & remount form on open
  useEffect(() => {
    if (isContactOpen) {
      document.body.style.overflow = "hidden";
      // Use RAF to avoid setState in effect warning
      requestAnimationFrame(() => {
        setMountKey((k) => k + 1);
      });
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isContactOpen]);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") closeContact();
    },
    [closeContact]
  );

  useEffect(() => {
    if (isContactOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isContactOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isContactOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeContact}
          />

          {/* Modal panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg flex flex-col sm:rounded-2xl overflow-hidden overflow-y-auto border-0 sm:border border-[rgba(184,151,58,0.2)] shadow-[0_0_60px_rgba(184,151,58,0.1)] bg-[#141414]"
            onClick={(e) => e.stopPropagation()}
          >
            <ContactForm
              key={mountKey}
              onClose={closeContact}
              defaultPlan={contactPlan}
              source={contactSource}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
