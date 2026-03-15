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
 */
export function CrispSupport() {
  useEffect(() => {
    // Crisp Website ID from env
    const CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

    if (!CRISP_WEBSITE_ID) {
      console.warn("[Crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID not configured");
      return;
    }

    // Initialize Crisp
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      // Remove Crisp widget when leaving dashboard
      const crispElements = document.querySelectorAll('[id^="crisp-chatbox"]');
      crispElements.forEach((el) => el.remove());
      delete window.$crisp;
      delete window.CRISP_WEBSITE_ID;
    };
  }, []);

  return null; // No UI, just loads the script
}
