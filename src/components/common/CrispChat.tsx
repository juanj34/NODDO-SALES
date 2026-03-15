"use client";

import { useEffect } from "react";
import { useCookieConsent } from "./CookieConsent";

declare global {
  interface Window {
    $crisp: Array<[string, ...unknown[]]>;
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispChat() {
  const { hasConsent, canUseMarketing } = useCookieConsent();
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

  useEffect(() => {
    // Only load if:
    // 1. Website ID is configured
    // 2. User has given consent (or hasn't been asked yet - Crisp is support, not pure marketing)
    // For support widgets, we can be more lenient than pure marketing cookies
    if (!websiteId) {
      console.warn("[Crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID not configured");
      return;
    }

    // If user has explicitly denied marketing cookies, respect that
    if (hasConsent && !canUseMarketing) {
      console.log("[Crisp] User denied marketing cookies, not loading chat");
      return;
    }

    // Load Crisp script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = websiteId;

    const script = document.createElement("script");
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);

    // Set custom colors to match NODDO branding
    script.onload = () => {
      if (window.$crisp) {
        // Set theme color to match NODDO gold
        window.$crisp.push(["config", "color:theme", ["gold"]]);
        window.$crisp.push(["config", "hide:on:away", false]);
        window.$crisp.push(["config", "hide:on:mobile", false]);
      }
    };

    return () => {
      // Cleanup on unmount
      const existingScript = document.querySelector('script[src*="crisp.chat"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [websiteId, hasConsent, canUseMarketing]);

  return null; // Crisp renders its own widget
}

/**
 * Helper functions to control Crisp from anywhere in your app
 */
export const CrispHelpers = {
  // Open chat window
  open: () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:open"]);
    }
  },

  // Close chat window
  close: () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:close"]);
    }
  },

  // Show chat box
  show: () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:show"]);
    }
  },

  // Hide chat box
  hide: () => {
    if (window.$crisp) {
      window.$crisp.push(["do", "chat:hide"]);
    }
  },

  // Send a message programmatically
  sendMessage: (message: string) => {
    if (window.$crisp) {
      window.$crisp.push(["do", "message:send", ["text", message]]);
    }
  },

  // Set user data
  setUser: (data: { email?: string; nickname?: string; phone?: string }) => {
    if (window.$crisp) {
      if (data.email) {
        window.$crisp.push(["set", "user:email", [data.email]]);
      }
      if (data.nickname) {
        window.$crisp.push(["set", "user:nickname", [data.nickname]]);
      }
      if (data.phone) {
        window.$crisp.push(["set", "user:phone", [data.phone]]);
      }
    }
  },

  // Set session data (custom attributes)
  setSessionData: (key: string, value: string) => {
    if (window.$crisp) {
      window.$crisp.push(["set", "session:data", [[key, value]]]);
    }
  },
};
