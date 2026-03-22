"use client";

import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";
import { trackEvent } from "@/lib/tracking";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { SectionTransition } from "@/components/site/SectionTransition";

const PDFViewer = dynamic(
  () =>
    import("@/components/site/PDFViewer").then((mod) => ({
      default: mod.PDFViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    ),
  }
);

export default function BrochurePage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

  useEffect(() => {
    if (proyecto.brochure_url) {
      trackEvent(proyecto.id, "brochure_view");
    }
  }, [proyecto.id, proyecto.brochure_url]);

  if (!proyecto.brochure_url) {
    return (
      <SectionTransition className="h-screen flex items-center justify-center px-8">
        <SiteEmptyState
          variant="brochure"
          title={t("brochure.notAvailable")}
          description={t("brochure.notConfigured")}
          compact
        />
      </SectionTransition>
    );
  }

  return (
    <AnimatePresence>
      <PDFViewer
        url={proyecto.brochure_url}
        onClose={() => window.history.back()}
        projectId={proyecto.id}
        projectName={proyecto.nombre}
      />
    </AnimatePresence>
  );
}
