"use client";

import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { Download, FileText } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";

export default function BrochurePage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  return (
    <SectionTransition className="h-screen flex items-center justify-center px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <div className="glass-card w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <FileText size={32} className="text-[var(--site-primary)]" />
        </div>

        <p className="text-xs tracking-[0.4em] text-[var(--site-primary)] mb-4 uppercase">
          {t("brochure.sectionLabel")}
        </p>

        <h2 className="font-site-heading text-2xl tracking-wider mb-4">
          {t("brochure.heading")}
        </h2>

        <p className="text-[var(--text-tertiary)] text-sm mb-8 leading-relaxed">
          {t("brochure.description", { name: proyecto.nombre })}
        </p>

        {proyecto.brochure_url ? (
          <div className="flex flex-col items-center gap-4">
            {/* PDF preview embed */}
            <div className="w-full max-w-md aspect-[3/4] rounded-2xl overflow-hidden glass-card">
              <iframe
                src={proyecto.brochure_url}
                className="w-full h-full border-0"
                title="Brochure PDF"
              />
            </div>

            <a
              href={proyecto.brochure_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-warm inline-flex items-center gap-2 px-8 py-3 text-sm tracking-[0.2em]"
            >
              <Download size={16} />
              {t("brochure.downloadPdf")}
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center">
              <FileText size={24} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-0.5">
                {t("brochure.notAvailable")}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                {t("brochure.notConfigured")}
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </SectionTransition>
  );
}
