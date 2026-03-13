"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, captureUtms } from "@/lib/tracking";

interface Props {
  proyectoId: string;
}

/**
 * Invisible component mounted in SiteLayoutClient.
 * Sends a pageview event on every route change.
 * UTMs and referrer are captured on first load by tracking.ts.
 */
export function SiteTracker({ proyectoId }: Props) {
  const pathname = usePathname();
  const prevPathRef = useRef<string | null>(null);

  // Capture UTMs on first mount (before any navigation changes the URL)
  useEffect(() => {
    captureUtms();
  }, []);

  // Track pageview on route change
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    trackEvent(proyectoId, "pageview", pathname);
  }, [pathname, proyectoId]);

  return null;
}
