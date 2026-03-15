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
  const isFirstRender = useRef(true);

  // Initialize state from localStorage or default
  const [value, setValueRaw] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  // Persist to localStorage on changes (skip first render to avoid re-saving initial value)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
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
