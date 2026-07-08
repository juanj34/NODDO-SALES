"use client";

import { useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";

// Same embedded viewer the Brochure tab uses — the document opens INSIDE the
// microsite shell (side nav visible), instead of a fullscreen overlay that
// feels like leaving the platform (owner request 2026-07-08).
const BrochureViewer = dynamic(() => import("../../brochure/BrochureViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-[var(--surface-0)]">
      <Loader2 className="animate-spin text-[var(--site-primary)]" size={28} />
    </div>
  ),
});

function isPDF(url: string): boolean {
  return url.toLowerCase().split("?")[0].endsWith(".pdf");
}

/** Viewer tab for a resource flagged mostrar_como_tab — behaves like /brochure. */
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
    <BrochureViewer
      url={recurso.url}
      projectId={proyecto.id}
      viewEvent="recurso_view"
      downloadEvent="recurso_download"
      title={recurso.nombre}
    />
  );
}
