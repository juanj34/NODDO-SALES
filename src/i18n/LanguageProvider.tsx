"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { Locale, Dictionary } from "./types";
import es from "./locales/es";
import en from "./locales/en";

const dictionaries: Record<Locale, Dictionary> = { es, en };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dictionary: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "noddo-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage OR cookie (auto-detection)
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "es";

    // 1️⃣ PRIMERO: Revisar localStorage (preferencia guardada explícitamente)
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "es") {
      document.documentElement.lang = stored;
      return stored;
    }

    // 2️⃣ SEGUNDO: Revisar cookie (auto-detectada por middleware)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('noddo-lang='))
      ?.split('=')[1] as Locale | undefined;

    if (cookieLocale === "en" || cookieLocale === "es") {
      document.documentElement.lang = cookieLocale;
      // Guardar en localStorage para futuras visitas
      localStorage.setItem(STORAGE_KEY, cookieLocale);
      return cookieLocale;
    }

    // 3️⃣ FALLBACK: Español por defecto
    document.documentElement.lang = "es";
    return "es";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    // Also update cookie for sync across tabs and server-side detection
    document.cookie = `noddo-lang=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = newLocale;
  }, []);

  const dictionary = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dictionary }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
