"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    $crisp?: Array<[string, ...unknown[]]>;
    CRISP_WEBSITE_ID?: string;
  }
}

/**
 * Crisp Chat widget for dashboard support
 * Only loads in dashboard/editor - NOT in public microsites
 * Idempotent — safe to mount multiple times (e.g. React StrictMode)
 */
export function CrispSupport() {
  useEffect(() => {
    const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    if (!CRISP_WEBSITE_ID) {
      console.warn("[Crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID not configured");
      return;
    }

    // Already loaded — just make sure it's visible
    if (document.querySelector('script[src*="crisp.chat"]')) {
      if (window.$crisp) {
        window.$crisp.push(["do", "chat:show"]);
      }
      return;
    }

    // Initialize Crisp globals BEFORE loading script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // No cleanup — Crisp should persist across dashboard/editor navigations
    // Removing and re-adding the script causes flickering and breaks the widget
  }, []);

  return null;
}
