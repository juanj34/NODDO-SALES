"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSiteBasePath } from "@/hooks/useSiteProject";

/**
 * Public contact was removed platform-wide (2026-07-02): the microsite is an
 * agent sales tool, not a self-service funnel. Old /contacto links redirect
 * to the microsite home instead of 404ing.
 */
export default function ContactoPage() {
  const basePath = useSiteBasePath();
  const router = useRouter();

  useEffect(() => {
    router.replace(basePath);
  }, [router, basePath]);

  return null;
}
