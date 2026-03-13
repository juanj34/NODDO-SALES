// ── Inputs & Labels ──────────────────────────────────────────────

export const inputClass =
  "w-full bg-[var(--surface-3)] border border-[var(--border-default)] rounded-[0.625rem] px-4 py-2.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[rgba(var(--site-primary-rgb),0.5)] focus:shadow-[0_0_0_3px_rgba(var(--site-primary-rgb),0.10)] transition-all";

export const labelClass =
  "block text-[13px] text-[var(--text-secondary)] mb-1.5 font-medium";

export const fieldHint =
  "text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed";

// ── Buttons ──────────────────────────────────────────────────────

export const btnPrimary =
  "flex items-center gap-1.5 px-4 py-2 bg-[var(--site-primary)] text-[#141414] rounded-[0.625rem] font-ui text-xs font-bold uppercase tracking-[0.1em] hover:brightness-110 hover:shadow-[0_4px_16px_rgba(var(--site-primary-rgb),0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed";

export const btnSecondary =
  "flex items-center gap-1.5 px-4 py-2 border border-[var(--border-default)] bg-[var(--surface-2)] rounded-[0.625rem] font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-strong)] hover:bg-[var(--surface-3)] transition-all";

export const btnDanger =
  "flex items-center gap-1.5 px-3 py-1.5 font-ui text-xs font-bold uppercase tracking-[0.1em] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-[0.625rem] transition-all";

// ── Page Layout ──────────────────────────────────────────────────

export const pageHeader =
  "flex items-start justify-between mb-8";

export const pageTitle =
  "font-heading text-2xl font-light text-white";

export const pageDescription =
  "text-sm text-[var(--text-tertiary)] mt-1 max-w-lg leading-relaxed";

export const sectionHeader =
  "flex items-center justify-between mb-6";

// ── Section Cards ────────────────────────────────────────────────

export const sectionCard =
  "p-6 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]";

export const sectionTitle =
  "flex items-center gap-2 font-ui text-xs font-bold uppercase tracking-[0.1em] text-white mb-1";

export const sectionDescription =
  "text-xs text-[var(--text-tertiary)] mb-5";

// ── Cards & Items ────────────────────────────────────────────────

export const cardClass =
  "p-5 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] hover:border-[var(--border-default)] transition-all";

export const listItem =
  "flex items-center gap-4 p-4 bg-[var(--surface-1)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--border-default)] transition-all group";

// ── Badges ───────────────────────────────────────────────────────

export const badge =
  "inline-flex items-center px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wider rounded-full";

export const badgeMuted =
  "inline-flex items-center px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wider rounded-full bg-[var(--surface-3)] text-[var(--text-tertiary)]";

export const badgeGold =
  "inline-flex items-center px-2 py-0.5 font-ui text-[10px] font-bold uppercase tracking-wider rounded-full bg-[rgba(var(--site-primary-rgb),0.15)] text-[var(--site-primary)]";

// ── Empty States ─────────────────────────────────────────────────

export const emptyState =
  "flex flex-col items-center justify-center py-20 text-center";

export const emptyStateIcon =
  "w-16 h-16 rounded-2xl bg-[var(--surface-2)] border border-[rgba(var(--site-primary-rgb),0.15)] flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(var(--site-primary-rgb),0.06)]";

export const emptyStateTitle =
  "font-heading text-lg font-light text-[var(--text-secondary)] mb-1.5";

export const emptyStateDescription =
  "text-[12px] leading-[1.7] text-[var(--text-muted)] mb-5 max-w-xs";
