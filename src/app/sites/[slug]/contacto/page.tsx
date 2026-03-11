"use client";

import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { LeadForm } from "@/components/site/LeadForm";
import { Mail } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";

export default function ContactoPage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  return (
    <SectionTransition className="relative h-screen flex items-center justify-center px-8 lg:px-16 overflow-hidden">
      {/* Blurred background image */}
      {proyecto.render_principal_url && (
        <div className="absolute inset-0 z-0">
          <img
            src={proyecto.render_principal_url}
            alt=""
            className="w-full h-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-[var(--site-bg)]/85" />
        </div>
      )}

      <div className="relative z-10 w-full max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Mail size={20} className="text-[var(--site-primary)]" />
            <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] uppercase">
              {t("contacto.sectionLabel")}
            </p>
          </div>
          <h2 className="font-site-heading text-2xl tracking-wider mb-2">
            {t("contacto.heading", { name: proyecto.nombre })}
          </h2>
          <p className="text-[var(--text-tertiary)] text-sm">
            {t("contacto.description")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LeadForm
            proyectoId={proyecto.id}
            tipologias={proyecto.tipologias}
          />
        </motion.div>
      </div>
    </SectionTransition>
  );
}
