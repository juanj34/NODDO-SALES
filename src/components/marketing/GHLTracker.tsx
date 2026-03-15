"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pushToGHL } from "@/lib/marketing-tracking";

/**
 * GHLTracker — Invisible component that auto-tags GHL contacts
 * based on browsing behavior.
 *
 * Only sends data if the visitor has already identified themselves
 * (email stored in localStorage from a previous form/booking).
 *
 * Events tracked:
 * - /pricing page visit → tag "pricing-viewed"
 * - /sites/* demo visit → tag "demo-live-viewed"
 * - Time on page > 3 min → tag "high-intent"
 * - Scroll > 80% of page → tag "high-engagement"
 */
export function GHLTracker() {
  const pathname = usePathname();
  const tagsSent = useRef<Set<string>>(new Set());
  const startTime = useRef<number | null>(null);
  if (startTime.current === null) {
    startTime.current = Date.now();
  }

  // Reset on route change
  useEffect(() => {
    startTime.current = Date.now();
  }, [pathname]);

  // Page-based tagging
  useEffect(() => {
    if (!hasGHLContact()) return;

    if (pathname === "/pricing" && !tagsSent.current.has("pricing-viewed")) {
      tagsSent.current.add("pricing-viewed");
      pushToGHL({
        tags: ["pricing-viewed"],
        note: "Visitó página de precios",
      });
    }

    if (pathname?.startsWith("/sites/") && !tagsSent.current.has("demo-live-viewed")) {
      tagsSent.current.add("demo-live-viewed");
      pushToGHL({
        tags: ["demo-live-viewed"],
        note: `Visitó demo en vivo: ${pathname}`,
      });
    }
  }, [pathname]);

  // Time-based tagging (3 minutes = high intent)
  useEffect(() => {
    if (!hasGHLContact()) return;

    const timer = setTimeout(() => {
      if (!tagsSent.current.has("high-intent")) {
        tagsSent.current.add("high-intent");
        pushToGHL({
          tags: ["high-intent"],
          note: `Más de 3 minutos en ${pathname}`,
        });
      }
    }, 3 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [pathname]);

  // Scroll-based tagging (80% scroll = high engagement)
  useEffect(() => {
    if (!hasGHLContact()) return;

    function handleScroll() {
      if (tagsSent.current.has("high-engagement")) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollPercent = window.scrollY / scrollHeight;
      if (scrollPercent > 0.8) {
        tagsSent.current.add("high-engagement");
        pushToGHL({
          tags: ["high-engagement"],
          note: `Scroll >80% en ${pathname}`,
        });
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return null;
}

function hasGHLContact(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("noddo_ghl_contact");
    if (!stored) return false;
    const { email } = JSON.parse(stored);
    return !!email;
  } catch {
    return false;
  }
}
