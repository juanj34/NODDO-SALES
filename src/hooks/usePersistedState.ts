"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Like `useState`, but persists the value in localStorage namespaced by slug.
 *
 * Key format: `noddo:{slug}:{key}` — so different projects never collide.
 *
 * SSR-safe: returns `defaultValue` during server render and hydrates from
 * localStorage on first client render.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  slug?: string,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = slug ? `noddo:${slug}:${key}` : `noddo:${key}`;

  const [value, setValueRaw] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === null) return defaultValue;
      return JSON.parse(stored) as T;
    } catch {
      return defaultValue;
    }
  });

  // Persist to localStorage whenever the value changes
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // quota exceeded or private browsing — ignore
    }
  }, [value, storageKey]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValueRaw(next);
    },
    [],
  );

  return [value, setValue];
}
