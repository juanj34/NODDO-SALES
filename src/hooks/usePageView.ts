import { useEffect } from "react";

export function usePageView(pageName: string, additionalData?: Record<string, any>) {
  useEffect(() => {
    // Google Analytics 4
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "page_view", {
        page_title: pageName,
        page_location: window.location.href,
        page_path: window.location.pathname,
        ...additionalData,
      });
    }

    // Facebook Pixel
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "PageView", {
        page_name: pageName,
        ...additionalData,
      });
    }

    // Custom dashboard tracking (si existe)
    if (typeof window !== "undefined" && (window as any).trackDashboardEvent) {
      (window as any).trackDashboardEvent("page_view", {
        page: pageName,
        ...additionalData,
      });
    }
  }, [pageName, additionalData]);
}
