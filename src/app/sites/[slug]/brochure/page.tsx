"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useSiteProject } from "@/hooks/useSiteProject";
import { useTranslation } from "@/i18n";
import { SiteEmptyState } from "@/components/site/SiteEmptyState";
import { SectionTransition } from "@/components/site/SectionTransition";

const BrochureViewer = dynamic(() => import("./BrochureViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[var(--surface-0)]">
      <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
    </div>
  ),
});

export default function BrochurePage() {
  const proyecto = useSiteProject();
  const { t } = useTranslation("site");

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
    <BrochureViewer url={proyecto.brochure_url} projectId={proyecto.id} />
  );
}
