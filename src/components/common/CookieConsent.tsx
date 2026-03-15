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
      // Load saved preferences - use queueMicrotask to avoid setState sync error
      const parsed = JSON.parse(saved) as CookiePreferences;
      queueMicrotask(() => setPreferences(parsed));
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
        <div className="pointer-events-auto relative overflow-hidden rounded-[1.25rem] border border-[#b8973a]/30 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md" style={{ background: 'linear-gradient(135deg, rgba(20,20,20,0.98) 0%, rgba(26,26,26,0.98) 100%)' }}>
          {/* Close button */}
          <button
            onClick={acceptNecessaryOnly}
            className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-white/40" />
          </button>

          <div className="p-4 sm:p-6">
            {/* Main content */}
            {!showDetails ? (
              <>
                <div className="mb-4 pr-8">
                  <h3 className="font-site-ui text-sm font-semibold text-white mb-2 tracking-wide">
                    🍪 PRIVACIDAD Y COOKIES
                  </h3>
                  <p className="font-site-body text-[13px] text-[var(--text-secondary)] leading-relaxed">
                    Usamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar
                    contenido. Al hacer clic en &quot;Aceptar todo&quot;, aceptas nuestro uso de
                    cookies.{" "}
                    <Link
                      href="/legal/privacidad"
                      className="text-[var(--site-primary)] hover:text-[var(--site-primary)]/80 underline"
                    >
                      Más información
                    </Link>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={acceptAll}
                    className="btn-warm flex-1 sm:flex-none px-6 py-2.5 text-sm"
                  >
                    Aceptar todo
                  </button>
                  <button
                    onClick={acceptNecessaryOnly}
                    className="btn-ghost flex-1 sm:flex-none px-6 py-2.5 text-sm"
                  >
                    Solo necesarias
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="btn-outline-warm flex-1 sm:flex-none px-6 py-2.5 text-sm"
                  >
                    Personalizar
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 pr-8">
                  <h3 className="font-site-ui text-sm font-semibold text-white mb-3 tracking-wide">
                    PERSONALIZAR COOKIES
                  </h3>
                  <p className="font-site-body text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
                    Elige qué tipos de cookies permitir. Las cookies necesarias siempre están
                    habilitadas para el funcionamiento básico del sitio.
                  </p>
                </div>

                {/* Cookie categories */}
                <div className="space-y-3 mb-4">
                  {/* Necessary */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/10">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="mt-0.5 w-4 h-4 rounded border-white/20"
                    />
                    <div className="flex-1">
                      <div className="font-site-ui text-xs font-semibold text-white mb-1 tracking-wide">
                        NECESARIAS (Siempre activas)
                      </div>
                      <p className="font-site-body text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                        Esenciales para el funcionamiento del sitio (autenticación, seguridad,
                        preferencias).
                      </p>
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/10">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 rounded border-white/20 accent-[var(--site-primary)]"
                    />
                    <div className="flex-1">
                      <div className="font-site-ui text-xs font-semibold text-white mb-1 tracking-wide">
                        ANALÍTICAS
                      </div>
                      <p className="font-site-body text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                        Nos ayudan a entender cómo usas el sitio para mejorarlo (Vercel Analytics,
                        Sentry).
                      </p>
                    </div>
                  </div>

                  {/* Marketing */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-white/10">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 rounded border-white/20 accent-[var(--site-primary)]"
                    />
                    <div className="flex-1">
                      <div className="font-site-ui text-xs font-semibold text-white mb-1 tracking-wide">
                        MARKETING
                      </div>
                      <p className="font-site-body text-[12px] text-[var(--text-tertiary)] leading-relaxed">
                        Permiten publicidad personalizada y medir la efectividad de campañas (Meta
                        Pixel, GTM).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={saveCustomPreferences}
                    className="btn-warm flex-1 sm:flex-none px-6 py-2.5 text-sm"
                  >
                    Guardar preferencias
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="btn-ghost flex-1 sm:flex-none px-6 py-2.5 text-sm"
                  >
                    Volver
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
    // Use queueMicrotask to avoid "Calling setState synchronously within an effect" error
    queueMicrotask(() => {
      // Check both localStorage and window object
      const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CookiePreferences;
        setConsent(parsed);
      } else if (window.__COOKIE_CONSENT__) {
        setConsent(window.__COOKIE_CONSENT__);
      }
    });

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
