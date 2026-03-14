"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { SectionTransition } from "@/components/site/SectionTransition";
import { Globe } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";

export default function Tour360Page() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  useEffect(() => {
    if (proyecto.tour_360_url) {
      trackEvent(proyecto.id, "tour_360_view");
    }
  }, [proyecto.id, proyecto.tour_360_url]);

  return (
    <SectionTransition className="h-screen flex flex-col">
      {/* Tour embed */}
      <div className="flex-1 px-4 pt-4 pb-12">
        {proyecto.tour_360_url ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full h-full rounded-2xl overflow-hidden glass-card"
          >
            <iframe
              src={proyecto.tour_360_url}
              className="w-full h-full border-0"
              allowFullScreen
              title="Tour Virtual 360°"
            />
          </motion.div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
              <Globe size={28} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <h2 className="text-lg font-site-heading text-[var(--text-secondary)] mb-1">
                {t("tour360.notAvailable")}
              </h2>
              <p className="text-sm text-[var(--text-tertiary)]">
                {t("tour360.notConfigured")}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionTransition>
  );
}
