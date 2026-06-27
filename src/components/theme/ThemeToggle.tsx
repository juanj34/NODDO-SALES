"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

/**
 * Light/dark toggle for the app surfaces (dashboard, platform-admin, marketing).
 * `sidebar` = full-width labelled row; `nav` = compact icon button.
 */
export function ThemeToggle({ variant = "nav" }: { variant?: "nav" | "sidebar" }) {
  const { theme, toggle } = useTheme();
  const label = theme === "dark" ? "Activar modo claro" : "Activar modo oscuro";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={
        variant === "sidebar"
          ? "flex items-center gap-3 w-full px-3 py-2 rounded-[0.625rem] font-ui text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-all"
          : "flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      }
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {variant === "sidebar" && <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>}
    </button>
  );
}
