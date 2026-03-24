"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSiteProject, useSiteBasePath } from "@/hooks/useSiteProject";
import { isSectionVisible } from "@/lib/secciones-visibles";
import type { SeccionesVisibles } from "@/types";

/**
 * Hook that redirects to the microsite home if a section is hidden.
 * Returns true if the section is visible (safe to render), false if redirecting.
 */
export function useSectionVisibility(section: keyof SeccionesVisibles): boolean {
  const proyecto = useSiteProject();
  const basePath = useSiteBasePath();
  const router = useRouter();
  const visible = isSectionVisible(proyecto.secciones_visibles, section);

  useEffect(() => {
    if (!visible) {
      router.replace(basePath);
    }
  }, [visible, basePath, router]);

  return visible;
}
