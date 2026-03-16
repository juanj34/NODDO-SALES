export type Locale = "es" | "en";

/* Recursive type: matches the shape of locale objects but allows any string values */
type TranslationValue = string | readonly string[] | { readonly [key: string]: TranslationValue };

export interface TranslationNamespace {
  readonly [key: string]: TranslationValue;
}

export interface Dictionary {
  common: TranslationNamespace;
  nav: TranslationNamespace;
  site: TranslationNamespace;
  dashboard: TranslationNamespace;
  editor: TranslationNamespace;
  help: TranslationNamespace;
  tooltips: TranslationNamespace;
  marketing: TranslationNamespace;
}
