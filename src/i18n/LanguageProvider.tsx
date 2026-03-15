"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
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
  // Initialize from localStorage
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "es";
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "en" || stored === "es") {
      document.documentElement.lang = stored;
      return stored;
    }
    return "es";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
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
