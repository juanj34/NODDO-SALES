"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import { ReactNode } from "react";

interface ReCaptchaProviderProps {
  children: ReactNode;
}

/**
 * ReCaptcha v3 provider for public site forms (leads, contact)
 * Only wraps site routes, not dashboard
 */
export function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // If no site key configured, render without protection (dev mode)
  if (!siteKey) {
    console.warn("⚠️ RECAPTCHA_SITE_KEY not configured - forms unprotected");
    return <>{children}</>;
  }

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey}>
      {children}
    </GoogleReCaptchaProvider>
  );
}
