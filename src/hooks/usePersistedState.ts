"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Like `useState`, but persists the value in localStorage namespaced by slug.
 *
 * Key format: `noddo:{slug}:{key}` — so different projects never collide.
 *
 * SSR-safe: always starts with `defaultValue` (matching server render),
 * then hydrates from localStorage after mount to avoid hydration mismatch.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  slug?: string,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = slug ? `noddo:${slug}:${key}` : `noddo:${key}`;

  // ALWAYS initialize with defaultValue (both server and client) to avoid hydration mismatch
  const [value, setValueRaw] = useState<T>(defaultValue);

  // Hydrate from localStorage AFTER mount (client-only, post-hydration)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as T;
        // Only update if different from default to avoid unnecessary re-render
        if (JSON.stringify(parsed) !== JSON.stringify(defaultValue)) {
          setValueRaw(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]); // Only run once on mount

  // Persist to localStorage on changes
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
