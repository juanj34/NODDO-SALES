# Theme Color Mapping — hardcoded → token

Canonical rules for converting hardcoded colors to theme tokens so they flip
between light and dark. Applies to `.tsx`/`.ts` under `src/` (NOT `globals.css`).

## Tailwind utilities

| Hardcoded | Replace with | When |
|---|---|---|
| `text-white` | `text-[var(--text-primary)]` | primary copy / headings |
| `text-white/90`, `/80`, `/70` | `text-[var(--text-primary)]` | strong text |
| `text-white/60`, `/55`, `/50` | `text-[var(--text-secondary)]` | secondary text |
| `text-white/40`, `/35`, `/30` | `text-[var(--text-tertiary)]` | tertiary/labels |
| `text-white/20` and below | `text-[var(--text-muted)]` | muted |
| `bg-white` | `bg-[var(--surface-0)]` | solid panel |
| `bg-white/5` | `bg-[var(--surface-2)]` | raised card |
| `bg-white/10`, `/8` | `bg-[var(--surface-3)]` | hover/active surface |
| `bg-white/20`+ | `bg-[var(--surface-4)]` | elevated |
| `bg-black` / `bg-black/90`/`/95` (page bg) | `bg-[var(--surface-0)]` | full page background |
| `bg-black/70`,`/60`,`/50`,`/40` (modal/scrim/overlay) | `bg-[rgba(var(--overlay-rgb),0.6)]` (keep alpha) | dim behind modal/lightbox/drawer |
| `border-white/5` | `border-[var(--border-subtle)]` | hairline |
| `border-white/10` | `border-[var(--border-default)]` | default border |
| `border-white/15`,`/20`+ | `border-[var(--border-strong)]` | strong border |
| `divide-white/10` | `divide-[var(--border-default)]` | list dividers |
| `ring-white/…` | `ring-[var(--border-strong)]` | focus rings (non-accent) |
| `from-black`/`to-black`/`via-black` (image gradient scrim) | `from-[rgba(var(--overlay-rgb),1)]` etc. | gradient over photos |
| `text-black` on gold buttons (`btn-noddo`/`btn-warm`/`btn-mk-primary`) | leave + `// theme-allow: dark text on gold` | button label is dark in both modes |
| `text-black` elsewhere | `text-[var(--text-primary)]` | rare |

## Inline `style={{ }}` and string literals

| Hardcoded | Replace with |
|---|---|
| `"#141414"`, `"#0a0a0a"`, `"#1a1a1a"` (a background) | `"var(--surface-0)"` (or `--surface-1`) |
| `"#fff"`, `"#ffffff"`, `"white"` (text) | `"var(--text-primary)"` |
| `rgba(255,255,255,a)` | `rgba(var(--contrast-rgb), a)` (inverts to ink on light) |
| `rgba(0,0,0,a)` as a scrim/overlay/shadow over imagery | `rgba(var(--overlay-rgb), a)` (stays dark) |
| `rgba(0,0,0,a)` as a card/page surface | use a `--surface-*` token |
| `"#b8973a"` literal gold | `"var(--site-primary)"` or `"var(--noddo-primary)"` |

## Genuinely theme-independent (keep + annotate)

When a color must stay the same in BOTH themes — a dark scrim/gradient sitting
directly over full-bleed photography or a satellite map, white map markers/labels,
text deliberately on a colored chip — keep it hardcoded and add a trailing
comment on the SAME line:

```tsx
<div className="bg-black/40" /> {/* theme-allow: scrim over hero photo */}
// or, for non-JSX lines:
background: "rgba(0,0,0,0.5)", // theme-allow: gradient over map tiles
```

The gate (`node scripts/check-hardcoded-colors.mjs`) skips any line containing
`// theme-allow`.

## Procedure per surface

1. `node scripts/check-hardcoded-colors.mjs src/<dir>` → list of `file:line token`.
2. Open each file, convert per the tables; judge scrim-vs-surface by context.
3. `npx tsc --noEmit` → no new errors.
4. Re-run the scoped gate → zero (except annotated `theme-allow`).
5. Do NOT run `next dev`/`next build` (Turbopack rejects the node_modules junction).

## Notes
- Accent gold on LIGHT: tokens already swap `--site-primary`/`--noddo-primary` to
  deep gold `#a07e2e` in light mode, so `text-[var(--site-primary)]` stays legible.
- Prefer existing tokens over inventing new ones. Surfaces: `--surface-0..4`.
  Text: `--text-primary/secondary/tertiary/muted`. Borders: `--border-subtle/default/strong`.
