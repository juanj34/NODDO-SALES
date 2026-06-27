import { THEMES, DEFAULT_THEME, type Theme } from "./constants";

/**
 * Resolve the effective theme from a cookie value.
 * Returns the cookie value when it is a known theme, else the dark default.
 * Pure — safe to call on server and client.
 */
export function resolveTheme(cookieValue: string | undefined | null): Theme {
  return THEMES.includes(cookieValue as Theme) ? (cookieValue as Theme) : DEFAULT_THEME;
}
