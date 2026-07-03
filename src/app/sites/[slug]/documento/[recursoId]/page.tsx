"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";

const PDFPresentationViewer = dynamic(
  () =>
    import("@/components/site/PDFPresentationViewer").then((mod) => ({
      default: mod.PDFPresentationViewer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[var(--surface-0)]">
        <Loader2 className="animate-spin text-[var(--site-primary)]" size={32} />
      </div>
    ),
  }
);

function isPDF(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

/** Fullscreen viewer tab for a resource flagged mostrar_como_tab. */
export default function DocumentoPage() {
  const proyecto = useSiteProject();
  const basePath = useSiteBasePath();
  const router = useRouter();
  const { recursoId } = useParams<{ recursoId: string }>();

  const goHome = useCallback(() => {
    router.replace(basePath || "/");
  }, [router, basePath]);

  const recurso = (proyecto.recursos ?? []).find(
    (r) => r.id === recursoId && r.mostrar_como_tab
  );
  const isValid = !!recurso && isPDF(recurso.url);

  // Redirect home on an unknown, unflagged, or non-PDF resource. Navigation
  // is a side effect, so it runs in an effect rather than during render.
  useEffect(() => {
    if (!isValid) goHome();
  }, [isValid, goHome]);

  if (!recurso || !isPDF(recurso.url)) {
    return null;
  }

  return (
    <PDFPresentationViewer
      url={recurso.url}
      title={recurso.nombre}
      onClose={goHome}
      projectId={proyecto.id}
      trackingEvent="recurso_download"
      trackingMeta={{ recurso: recurso.nombre, tipo: recurso.tipo }}
    />
  );
}
