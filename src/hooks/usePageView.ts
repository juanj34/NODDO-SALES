import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
    fbq?: (command: string, eventName: string, params: Record<string, unknown>) => void;
    trackDashboardEvent?: (eventName: string, params: Record<string, unknown>) => void;
  }
}

export function usePageView(pageName: string, additionalData?: Record<string, unknown>) {
  useEffect(() => {
    // Google Analytics 4
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalData,
      });
    }

    // Facebook Pixel
    if (typeof window !== "undefined" && window.fbq) {
      window.fbq("track", "PageView", {
        page_name: pageName,
        ...additionalData,
      });
    }

    // Custom dashboard tracking (si existe)
    if (typeof window !== "undefined" && window.trackDashboardEvent) {
      window.trackDashboardEvent("page_view", {
        page: pageName,
        ...additionalData,
      });
    }
  }, [pageName, additionalData]);
}
