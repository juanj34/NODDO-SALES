"use client";

import { useCallback } from "react";
import { useLanguage } from "./LanguageProvider";
import type { Dictionary } from "./types";

type Namespace = keyof Dictionary;

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation<N extends Namespace>(namespace: N) {
  const { dictionary, locale } = useLanguage();
  const ns = dictionary[namespace];

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let value = getNestedValue(ns as unknown as Record<string, unknown>, key);
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(`{{${k}}}`, String(v));
        });
      }
      return value;
    },
    [ns]
  );

  return { t, locale };
}
