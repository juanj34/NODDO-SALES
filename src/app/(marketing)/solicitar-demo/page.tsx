"use client";

import { motion } from "framer-motion";
import { ContactForm } from "@/components/marketing/ContactForm";
import { useTranslation } from "@/i18n";

export default function SolicitarDemoPage() {
  const { t } = useTranslation("marketing");

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-[10px] font-ui uppercase tracking-[0.25em] text-[var(--mk-accent)] mb-4">
            {t("demoRequest.badge")}
          </span>
          <h1 className="text-3xl md:text-4xl font-heading font-light text-[var(--mk-text)] leading-tight mb-3">
            {t("demoRequest.title")}
          </h1>
          <p className="text-sm text-[var(--mk-text-secondary)] max-w-md mx-auto leading-relaxed">
            {t("demoRequest.subtitle")}
          </p>
        </motion.div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-[1.25rem] border border-[rgba(184,151,58,0.12)] overflow-hidden"
          style={{
            background: "linear-gradient(to bottom, rgba(26,26,26,0.95), rgba(20,20,20,0.98))",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
          }}
        >
          <ContactForm source="solicitar-demo" />
        </motion.div>
      </div>
    </div>
  );
}
