# Light / Dark Theming — NodeSites (NODDO-SALES)

**Date:** 2026-06-26
**Status:** Approved (design) → implementation
**Author:** Claude (with Juan)

## Goal

Add a fully working **light and dark mode** across every surface of the platform.
Today everything is hardcoded dark. Definition of done: **100% of pages render
correctly in both modes**, verified by an automated static gate (no hardcoded
colors remain) **and** Playwright screenshots of every route in both themes.

## Surfaces (two tracks)

| Track | Surface | Routes | Current theming |
|---|---|---|---|
| **B** | Marketing / landing | `src/app/(marketing)/*` (~24) | Hardcoded dark via `.marketing` `--mk-*` tokens + hardcoded colors |
| **B** | Dashboard (constructora admin) | `src/app/(dashboard)/*` (~15 + editor `[id]/*` ~22 sub-tabs) | Hardcoded dark via `:root` tokens + hardcoded colors |
| **B** | Platform-admin (super admin) | `src/app/(platform-admin)/admin/*` (~14) | Hardcoded dark via `:root` tokens + hardcoded colors |
| **A** | Project microsites | `src/app/sites/[slug]/*` (~13) + `src/components/site` | **Per-project light/dark ALREADY works** via `proyecto.tema_modo` + `getLightThemeVars()` |

## Decisions (locked 2026-06-26)

1. **App surfaces default:** follow OS (`prefers-color-scheme`), fallback **dark**; manual toggle overrides.
2. **Persistence:** cookie `noddo-theme` (SSR-readable → zero FOUC) + sync to `profiles.theme` (Supabase) when logged in (cross-device).
3. **Microsites:** keep owner-controlled per-project (`tema_modo`). No buyer-facing toggle. Work = audit/fix hardcoded colors so the existing light mode is flawless.
4. **Verification ("100%"):** static gate (lint/grep fails on any hardcoded color) **+** Playwright dual-theme screenshots of every route.

## Approach (chosen)

**Semantic token redefinition driven by `data-theme`** — the same pattern the
microsites already use (`getLightThemeVars()`). Rejected: Tailwind `dark:` variants
(~2,400 edits, doesn't cover inline `style`/CSS, fights the token system).

### Mechanism (Track B — no FOUC)
- `data-theme="light|dark"` on `<html>`. Root layout is a server component → reads the
  `noddo-theme` cookie and renders `<html data-theme={theme}>`. SSR-correct, no flash.
- First visit (no cookie): a tiny **blocking inline script** in `<head>` reads
  `prefers-color-scheme` and sets `data-theme` before paint. No OS signal → `dark`.
- Lightweight hand-rolled `ThemeProvider` (no `next-themes`; we need cookie SSR read +
  profile sync). Exposes `useTheme() → { theme, setTheme, toggle }`. Writes cookie;
  when logged in, mirrors to `profiles.theme` and reconciles on login.
- **Toggle UI:** sun/moon control in dashboard sidebar, platform-admin shell, and
  marketing nav. Simple light/dark; "follow system" available in account settings.
- **Microsites stay isolated:** their container sets `--surface-*` etc. via inline
  `style`, which wins over `:root[data-theme]` for the whole subtree. The global toggle
  does not affect them.

### Token light-mode definitions
- `:root[data-theme="light"]`: redefine `--surface-0..4` (warm paper #faf9f7 → #d8d4cd),
  `--text-primary..muted` (ink #141412 alphas), `--border-*`, `--glass-*`, `--shadow-*`
  (soft), `--overlay-rgb`/`--contrast-rgb` (inverted), `--background`/`--foreground`.
- `.marketing` light: `[data-theme="light"] .marketing` redefines all `--mk-*`.
- Hardcoded CSS classes to fix: `.input-glass` (`color:white`), `.login-card`,
  `.tiptap-editor` (`color:white`), scrollbars (`rgba(255,255,255…)`), `.glass-panel`,
  `.gradient-warm`, map markers.
- **Accessibility:** gold `#b8973a` loses contrast on light. Rule: gold for fills/accents;
  for **text on light** use `--noddo-tertiary` (#a07e2e) or darker. Light mode must meet
  **WCAG AA** (text ≥ 4.5:1). Validated in verification.

### Audit & conversion (the bulk — ~1,200 hardcoded usages across 344 .tsx)
Canonical mapping table, e.g.:
- `text-white` → `text-[var(--text-primary)]`; `text-white/60` → `text-[var(--text-secondary)]`
- `bg-black/60` (overlay) → `bg-[rgba(var(--overlay-rgb),.6)]`
- `border-white/10` → `border-[var(--border-default)]`
- literal `#141414` → `var(--surface-0)`; `bg-white/5` → `bg-[var(--surface-2)]` / glass
Run **in parallel by surface** (marketing, dashboard, platform-admin, shared
`ui`/`common`, microsites). Each lot converts + self-verifies (tsc + lint), then passes
the gate. This is the "loop until 100%".

### Track A — Microsites
No new mechanism. Audit/fix hardcoded colors in `sites/[slug]` + `components/site` that
bypass `--overlay-rgb`/`--contrast-rgb`, so `tema_modo:"claro"` is flawless.

### Verification = definition of 100%
- **Static gate:** `scripts/check-hardcoded-colors.mjs` (+ ESLint rule) fails on any
  blacklisted hardcoded pattern. Wired into `npm run lint` / CI. Prevents regressions.
- **Playwright dual-theme:** walk every route (all marketing, dashboard, platform-admin,
  one representative microsite in `oscuro` + `claro`), screenshot in `data-theme=light`
  and `dark`. Contact sheet for visual + contrast review.
- **Loop:** gate → screenshots → review → fix → repeat until (a) gate green and
  (b) zero visual/contrast issues in both modes.

## Out of scope
- Buyer-facing toggle on microsites.
- Redesigning layouts/components beyond color theming.
- PDF/email themes (`pdf_theme`, `email_tema`) — already separate fields, untouched here.

## Risks
- Light over full-bleed dom photography (marketing hero, microsite heroes): scrims/overlays
  must stay legible — handled via `--overlay-rgb` and per-section guards, verified visually.
- Gold-on-light contrast (see accessibility rule).
- Map (Mapbox) markers/tooltips hardcode white/black — fix via tokens.
