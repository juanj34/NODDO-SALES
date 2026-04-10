"use client";

import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Clock,
  BarChart3,
  Building2,
  Globe,
} from "lucide-react";
import { ContactForm } from "@/components/marketing/ContactForm";
import { useTranslation } from "@/i18n";

const BENEFITS = [
  {
    icon: Zap,
    titleKey: "demoRequest.benefit1Title",
    descKey: "demoRequest.benefit1Desc",
  },
  {
    icon: Clock,
    titleKey: "demoRequest.benefit2Title",
    descKey: "demoRequest.benefit2Desc",
  },
  {
    icon: Building2,
    titleKey: "demoRequest.benefit3Title",
    descKey: "demoRequest.benefit3Desc",
  },
  {
    icon: BarChart3,
    titleKey: "demoRequest.benefit4Title",
    descKey: "demoRequest.benefit4Desc",
  },
  {
    icon: Globe,
    titleKey: "demoRequest.benefit5Title",
    descKey: "demoRequest.benefit5Desc",
  },
  {
    icon: Shield,
    titleKey: "demoRequest.benefit6Title",
    descKey: "demoRequest.benefit6Desc",
  },
];

export default function SolicitarDemoPage() {
  const { t } = useTranslation("marketing");

  return (
    <div className="min-h-screen bg-[var(--mk-bg)] pt-32 pb-24 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-[10px] font-ui uppercase tracking-[0.25em] text-[var(--mk-accent)] mb-4">
            {t("demoRequest.badge")}
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-light text-[var(--mk-text)] leading-tight mb-4">
            {t("demoRequest.title")}
          </h1>
          <p className="text-base text-[var(--mk-text-secondary)] max-w-xl mx-auto leading-relaxed">
            {t("demoRequest.subtitle")}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Benefits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-heading font-light text-[var(--mk-text)] mb-8">
              {t("demoRequest.whyTitle")}
            </h2>
            <div className="space-y-5">
              {BENEFITS.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[rgba(184,151,58,0.08)] border border-[rgba(184,151,58,0.15)] flex items-center justify-center flex-shrink-0">
                    <b.icon size={18} className="text-[var(--mk-accent)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--mk-text)] mb-0.5">
                      {t(b.titleKey)}
                    </h3>
                    <p className="text-xs text-[var(--mk-text-secondary)] leading-relaxed">
                      {t(b.descKey)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-[1.25rem] border border-[rgba(184,151,58,0.12)] overflow-hidden"
            style={{
              background: "linear-gradient(to bottom, rgba(26,26,26,0.95), rgba(20,20,20,0.98))",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.4)",
            }}
          >
            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-heading font-light text-[var(--mk-text)] mb-1">
                {t("demoRequest.formTitle")}
              </h2>
              <p className="text-xs text-[var(--mk-text-secondary)] mb-6">
                {t("demoRequest.formSubtitle")}
              </p>
              <ContactForm source="solicitar-demo" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
