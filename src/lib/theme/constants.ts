export type Theme = "light" | "dark";

export const THEMES: readonly Theme[] = ["light", "dark"] as const;

/** Cookie that carries the user's chosen theme; read server-side for zero-FOUC SSR. */
export const THEME_COOKIE = "noddo-theme";

/** Fallback when there is no cookie and no OS signal. Keeps the current dark identity. */
export const DEFAULT_THEME: Theme = "dark";
