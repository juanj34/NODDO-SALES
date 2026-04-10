"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface CookiePreferences {
  necessary: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

declare global {
  interface Window {
    __COOKIE_CONSENT__?: CookiePreferences;
  }
}

const COOKIE_CONSENT_KEY = "noddo_cookie_consent";

// Declare function before using it to fix "Cannot access variable before it is declared"
function applyConsent(prefs: CookiePreferences) {
  // Store in window for other components to check
  if (typeof window !== "undefined") {
    window.__COOKIE_CONSENT__ = prefs;

    // Enable/disable analytics
    if (prefs.analytics) {
      // Enable Vercel Analytics, PostHog, etc.
      console.log("[Cookie Consent] Analytics enabled");
    } else {
      console.log("[Cookie Consent] Analytics disabled");
    }

    // Enable/disable marketing
    if (prefs.marketing) {
      // Enable Meta Pixel, GTM, etc.
      console.log("[Cookie Consent] Marketing cookies enabled");
    } else {
      console.log("[Cookie Consent] Marketing cookies disabled");
    }
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: 0, // Will be set in useEffect or on user action
  });

  useEffect(() => {
    // Check if user has already made a choice
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) {
      // Small delay for better UX (let page load first)
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences - use setTimeout to avoid setState sync error
      const parsed = JSON.parse(saved) as CookiePreferences;
      setTimeout(() => setPreferences(parsed), 0);
      applyConsent(parsed);
    }
  }, []);

  const acceptAll = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    applyConsent(prefs);
    setShowBanner(false);
  };

  const acceptNecessaryOnly = () => {
    const prefs: CookiePreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setPreferences(prefs);
    applyConsent(prefs);
    setShowBanner(false);
  };

  const saveCustomPreferences = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
    applyConsent(preferences);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] pointer-events-none">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="pointer-events-auto relative overflow-hidden rounded-[1.25rem] border border-[#b8973a]/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl" style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(26,26,26,0.95) 100%)' }}>
          <div className={showDetails ? "p-4 sm:p-5" : "px-4 sm:px-5 py-3"}>
            {/* Main content — compact single row */}
            {!showDetails ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <p className="flex-1 text-[12px] text-[var(--text-secondary)] leading-relaxed min-w-0">
                  Usamos cookies para mejorar tu experiencia y analizar el tráfico.{" "}
                  <Link
                    href="/legal/privacidad"
                    className="text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 underline"
                  >
                    Más información
                  </Link>
                </p>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={acceptAll}
                    className="btn-warm px-4 py-1.5 text-xs"
                  >
                    Aceptar
                  </button>
                  <button
                    onClick={acceptNecessaryOnly}
                    className="btn-ghost px-4 py-1.5 text-xs"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="btn-outline-warm px-4 py-1.5 text-xs"
                  >
                    Personalizar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-ui text-xs font-bold uppercase text-white tracking-wide">
                    PERSONALIZAR COOKIES
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                    aria-label="Cerrar"
                  >
                    <X className="w-3.5 h-3.5 text-white/40" />
                  </button>
                </div>

                {/* Cookie categories — compact */}
                <div className="space-y-2 mb-3">
                  {/* Necessary */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/10">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-3.5 h-3.5 rounded border-white/20"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-ui text-[11px] font-semibold text-white tracking-wide">
                        NECESARIAS
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] ml-1.5">
                        — siempre activas
                      </span>
                    </div>
                  </label>

                  {/* Analytics */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded border-white/20 accent-[var(--site-primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-ui text-[11px] font-semibold text-white tracking-wide">
                        ANALÍTICAS
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] ml-1.5">
                        — uso del sitio, métricas
                      </span>
                    </div>
                  </label>

                  {/* Marketing */}
                  <label className="flex items-center gap-3 p-2.5 rounded-lg bg-white/3 border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                      className="w-3.5 h-3.5 rounded border-white/20 accent-[var(--site-primary)]"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="font-ui text-[11px] font-semibold text-white tracking-wide">
                        MARKETING
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] ml-1.5">
                        — publicidad personalizada
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={saveCustomPreferences}
                    className="btn-warm px-5 py-1.5 text-xs"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={acceptNecessaryOnly}
                    className="btn-ghost px-4 py-1.5 text-xs"
                  >
                    Solo necesarias
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if specific cookie category is allowed
 */
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    // Check both localStorage and window object - use setTimeout to avoid setState sync error
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as CookiePreferences;
      setTimeout(() => setConsent(parsed), 0);
    } else if (window.__COOKIE_CONSENT__) {
      setTimeout(() => setConsent(window.__COOKIE_CONSENT__!), 0);
    }

    // Listen for changes
    const handler = () => {
      const updated = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (updated) {
        const parsed = JSON.parse(updated) as CookiePreferences;
        setConsent(parsed);
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  return {
    hasConsent: consent !== null,
    canUseAnalytics: consent?.analytics ?? false,
    canUseMarketing: consent?.marketing ?? false,
    preferences: consent,
  };
}
