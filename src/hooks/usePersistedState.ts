"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  const initialized = useRef(false);

  const [value, setValueRaw] = useState<T>(defaultValue);

  // Hydrate from localStorage on mount, then persist on subsequent changes
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored !== null) {
          setValueRaw(JSON.parse(stored) as T);
          return; // Don't persist the default back — wait for hydrated value
        }
      } catch {
        // ignore
      }
    }
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
