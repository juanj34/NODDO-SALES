# Light / Dark Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fully working light/dark mode across every NodeSites surface (marketing, dashboard, platform-admin, project microsites), verified at 100% by a static gate + Playwright dual-theme screenshots.

**Architecture:** Semantic CSS-variable tokens redefined under `:root[data-theme="light"]` (mirrors the microsites' existing `getLightThemeVars()` pattern). A server-read cookie sets `data-theme` on `<html>` (no FOUC) with an inline OS-detection fallback; a lightweight ThemeProvider persists choice to a cookie + `user_profiles.theme`. The bulk of work is auditing ~1,200 hardcoded color usages across 344 `.tsx` files and converting them to tokens, gated by an automated hardcoded-color linter.

**Tech Stack:** Next.js 16 (App Router, server components), Tailwind CSS v4 (`@theme`), TypeScript strict, Supabase, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-26-light-dark-theming-design.md`

**Commands:** `npm run dev` · `npm run build` · `npm run lint` · `npx vitest run <file>` · `npx playwright test <file>`

---

## File Structure

**New files:**
- `src/lib/theme/constants.ts` — `Theme` type, `THEME_COOKIE`, `THEMES`.
- `src/lib/theme/resolve.ts` — pure `resolveTheme(cookieValue): Theme` (cookie → `dark` fallback).
- `src/lib/theme/__tests__/resolve.test.ts` — unit tests for resolve.
- `src/components/theme/ThemeScript.tsx` — blocking inline `<head>` script: if no cookie, set `data-theme` from `prefers-color-scheme`.
- `src/components/theme/ThemeProvider.tsx` — client context; `useTheme()`; writes cookie + (logged in) POSTs `/api/user/theme`.
- `src/components/theme/ThemeToggle.tsx` — sun/moon toggle, two variants (`sidebar`, `nav`).
- `src/app/api/user/theme/route.ts` — `POST { theme }` → upsert `user_profiles.theme` for the authed user.
- `supabase/migrations/20260626120000_add_theme_to_user_profiles.sql` — add `theme text` column.
- `scripts/check-hardcoded-colors.mjs` — static gate; scans `src/**/*.{tsx,ts,css}` for blacklisted patterns.
- `scripts/__tests__/check-hardcoded-colors.test.ts` — gate unit tests.
- `tests/e2e/theme-screenshots.spec.ts` — Playwright walker: every route × {light, dark}.
- `docs/superpowers/theme-color-mapping.md` — the canonical hardcoded→token mapping table (reference for conversion agents).

**Modified files:**
- `src/app/layout.tsx` — server-read cookie, `<html data-theme>`, mount `ThemeScript` + `ThemeProvider`.
- `src/app/globals.css` — add `:root[data-theme="light"]`, `.marketing` light overrides, fix hardcoded CSS classes.
- `src/types/database.ts` + `src/types/index.ts` — add `theme` to `user_profiles`.
- `src/app/(dashboard)/layout.tsx` — mount `<ThemeToggle variant="sidebar" />`.
- `src/app/(platform-admin)/layout.tsx` — mount `<ThemeToggle variant="sidebar" />`.
- `src/components/marketing/MarketingNav.tsx` — mount `<ThemeToggle variant="nav" />`.
- `package.json` — `lint` script also runs `check-hardcoded-colors`.
- All `.tsx`/`.css` carrying hardcoded colors (conversion phase, batched by surface).

---

## Phase 0 — Foundations (theme mechanism)

### Task 1: Theme constants + pure resolver (TDD)

**Files:**
- Create: `src/lib/theme/constants.ts`
- Create: `src/lib/theme/resolve.ts`
- Test: `src/lib/theme/__tests__/resolve.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/theme/__tests__/resolve.test.ts
import { describe, it, expect } from "vitest";
import { resolveTheme } from "../resolve";

describe("resolveTheme", () => {
  it("returns the cookie value when valid", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
  it("falls back to dark when cookie missing or invalid", () => {
    expect(resolveTheme(undefined)).toBe("dark");
    expect(resolveTheme("")).toBe("dark");
    expect(resolveTheme("banana")).toBe("dark");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/theme/__tests__/resolve.test.ts`
Expected: FAIL — cannot resolve `../resolve`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/theme/constants.ts
export type Theme = "light" | "dark";
export const THEMES: readonly Theme[] = ["light", "dark"] as const;
export const THEME_COOKIE = "noddo-theme";
export const DEFAULT_THEME: Theme = "dark";
```

```ts
// src/lib/theme/resolve.ts
import { THEMES, DEFAULT_THEME, type Theme } from "./constants";

export function resolveTheme(cookieValue: string | undefined | null): Theme {
  return THEMES.includes(cookieValue as Theme) ? (cookieValue as Theme) : DEFAULT_THEME;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/theme/__tests__/resolve.test.ts`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme
git commit -m "feat(theme): add theme constants and pure resolver"
```

---

### Task 2: No-FOUC inline ThemeScript

**Files:**
- Create: `src/components/theme/ThemeScript.tsx`

- [ ] **Step 1: Implement the blocking script**

The script only acts when there is **no** `noddo-theme` cookie (otherwise the server already set `data-theme`). It picks OS preference, else `dark`, and writes both the attribute and the cookie so the next SSR is correct.

```tsx
// src/components/theme/ThemeScript.tsx
// Rendered in <head> BEFORE paint. Keep dependency-free and tiny.
export function ThemeScript() {
  const js = `(function(){try{
    var m=document.cookie.match(/(?:^|; )noddo-theme=([^;]+)/);
    if(m)return; // server already applied the cookie theme
    var t=(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark';
    document.documentElement.setAttribute('data-theme',t);
    document.cookie='noddo-theme='+t+'; path=/; max-age=31536000; samesite=lax';
  }catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: js }} />;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/theme/ThemeScript.tsx
git commit -m "feat(theme): add no-FOUC inline theme script"
```

---

### Task 3: Wire `data-theme` into the root layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Read the cookie server-side and apply it**

Replace the `RootLayout` function (currently `src/app/layout.tsx:75-93`) with the version below. `cookies()` is async in Next 16 — the component becomes `async`.

```tsx
import { cookies } from "next/headers";
import { resolveTheme } from "@/lib/theme/resolve";
import { THEME_COOKIE } from "@/lib/theme/constants";
import { ThemeScript } from "@/components/theme/ThemeScript";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = resolveTheme(cookieStore.get(THEME_COOKIE)?.value);
  return (
    <html lang="es" data-theme={theme} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${cormorant.variable} ${dmMono.variable} ${inter.variable} ${syne.variable} antialiased`}
      >
        <ThemeProvider initialTheme={theme}>
          <ReactQueryProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify build compiles** (ThemeProvider exists after Task 4 — if doing in order, temporarily stub it, or implement Task 4 first then return). Run: `npx tsc --noEmit`. Expected: resolves once Task 4 is in.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(theme): server-render data-theme from cookie on <html>"
```

---

### Task 4: ThemeProvider + useTheme

**Files:**
- Create: `src/components/theme/ThemeProvider.tsx`

- [ ] **Step 1: Implement the provider**

```tsx
// src/components/theme/ThemeProvider.tsx
"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { THEME_COOKIE, type Theme } from "@/lib/theme/constants";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);

function writeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
}

export function ThemeProvider({
  initialTheme,
  children,
}: {
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    writeCookie(t);
    // Best-effort cross-device sync for logged-in users; ignore failures (logged-out).
    fetch("/api/user/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
      keepalive: true,
    }).catch(() => {});
  }, []);

  const toggle = useCallback(
    () => setTheme(theme === "dark" ? "light" : "dark"),
    [theme, setTheme]
  );

  // Keep attribute in sync if the provider remounts.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: Task 3 + Task 4 now both resolve, no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/theme/ThemeProvider.tsx
git commit -m "feat(theme): add ThemeProvider + useTheme hook"
```

---

### Task 5: `theme` column on user_profiles + persistence API

**Files:**
- Create: `supabase/migrations/20260626120000_add_theme_to_user_profiles.sql`
- Create: `src/app/api/user/theme/route.ts`
- Modify: `src/types/database.ts` (user_profiles Row/Insert/Update at lines ~2074-2091)

- [ ] **Step 1: Migration**

```sql
-- supabase/migrations/20260626120000_add_theme_to_user_profiles.sql
alter table public.user_profiles
  add column if not exists theme text
  check (theme in ('light','dark'));
```

- [ ] **Step 2: Add `theme` to the database types**

In `src/types/database.ts`, in the `user_profiles` block, add `theme: string | null` to `Row`, and `theme?: string | null` to `Insert` and `Update`.

- [ ] **Step 3: API route**

```ts
// src/app/api/user/theme/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { THEMES, type Theme } from "@/lib/theme/constants";

export async function POST(req: Request) {
  const { theme } = (await req.json().catch(() => ({}))) as { theme?: string };
  if (!THEMES.includes(theme as Theme)) {
    return NextResponse.json({ error: "invalid theme" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 200 }); // logged-out is fine
  await supabase.from("user_profiles").upsert({ id: user.id, theme }, { onConflict: "id" });
  return NextResponse.json({ ok: true });
}
```

> Confirm the server client import matches the codebase (`src/lib/supabase/server.ts`). If `createClient` is named differently, match the existing API routes under `src/app/api/`.

- [ ] **Step 4: Reconcile profile→cookie on login.** In the auth callback (`src/app/auth/callback/route.ts`), after the session is established, read `user_profiles.theme`; if present, set the `noddo-theme` cookie on the redirect response so the next SSR matches the account preference.

- [ ] **Step 5: Typecheck + commit**

Run: `npx tsc --noEmit` → no new errors.

```bash
git add supabase/migrations/20260626120000_add_theme_to_user_profiles.sql src/app/api/user/theme/route.ts src/types/database.ts src/app/auth/callback/route.ts
git commit -m "feat(theme): persist theme to user_profiles + reconcile on login"
```

---

### Task 6: ThemeToggle UI

**Files:**
- Create: `src/components/theme/ThemeToggle.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/components/theme/ThemeToggle.tsx
"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";

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
          ? "flex items-center gap-2 w-full px-3 py-2 rounded-[0.625rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          : "flex items-center justify-center w-9 h-9 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      }
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      {variant === "sidebar" && (
        <span className="font-ui text-[11px] uppercase tracking-wider">
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 2: Mount it in the three shells**
  - `src/app/(dashboard)/layout.tsx`: add `<ThemeToggle variant="sidebar" />` near the sidebar footer / account area.
  - `src/app/(platform-admin)/layout.tsx`: same, in the admin sidebar.
  - `src/components/marketing/MarketingNav.tsx`: add `<ThemeToggle variant="nav" />` in the nav actions cluster.

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit` → no new errors.

```bash
git add src/components/theme/ThemeToggle.tsx "src/app/(dashboard)/layout.tsx" "src/app/(platform-admin)/layout.tsx" src/components/marketing/MarketingNav.tsx
git commit -m "feat(theme): add ThemeToggle and mount in dashboard, admin, marketing shells"
```

---

## Phase 1 — Static verification gate

### Task 7: Hardcoded-color linter (TDD)

**Files:**
- Create: `scripts/check-hardcoded-colors.mjs`
- Test: `scripts/__tests__/check-hardcoded-colors.test.ts`

The gate scans `src/**/*.{tsx,ts,css}` (excluding `globals.css`, which legitimately defines raw colors, and `node_modules`) for blacklisted patterns and exits non-zero with file:line on any hit.

**Blacklist (Tailwind utilities + literals that bypass tokens):**
`text-white`, `text-black`, `bg-white`, `bg-black`, `border-white`, `border-black`, `white/<n>`, `black/<n>`, `divide-white`, `ring-white`, `from-white`, `to-white`, `via-black` (and gradient variants), literal hex (`#fff`, `#000`, `#141414`, `#1a1a1a`, `#0a0a0a`), and literal `rgba(255,255,255,…)` / `rgba(0,0,0,…)` inside `.tsx`/`.ts`.

**Allowlist mechanism:** a trailing `// theme-allow: <reason>` comment on the line (for genuinely theme-independent cases, e.g. an always-dark photo scrim) suppresses that line. The gate reports the count of allowances.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/__tests__/check-hardcoded-colors.test.ts
import { describe, it, expect } from "vitest";
import { findHardcodedColors } from "../check-hardcoded-colors.mjs";

describe("findHardcodedColors", () => {
  it("flags hardcoded Tailwind color utilities", () => {
    const hits = findHardcodedColors('<div className="text-white bg-black/60" />', "a.tsx");
    expect(hits.map((h) => h.token)).toEqual(expect.arrayContaining(["text-white", "bg-black/60"]));
  });
  it("flags literal hex and rgba in tsx", () => {
    expect(findHardcodedColors('style={{ color: "#141414" }}', "a.tsx").length).toBeGreaterThan(0);
    expect(findHardcodedColors('background: "rgba(255,255,255,0.1)"', "a.tsx").length).toBeGreaterThan(0);
  });
  it("does not flag token usages", () => {
    expect(findHardcodedColors('className="text-[var(--text-primary)] bg-[var(--surface-2)]"', "a.tsx")).toEqual([]);
  });
  it("respects // theme-allow", () => {
    expect(findHardcodedColors('<div className="bg-black/80" /> // theme-allow: photo scrim', "a.tsx")).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run scripts/__tests__/check-hardcoded-colors.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the gate**

```js
// scripts/check-hardcoded-colors.mjs
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const PATTERNS = [
  /\b(?:text|bg|border|divide|ring|from|via|to)-(?:white|black)(?:\/\d{1,3})?\b/g,
  /#(?:fff|000)\b/gi,
  /#(?:141414|1a1a1a|0a0a0a|222222|2a2a2a|333333)\b/gi,
  /rgba\(\s*255\s*,\s*255\s*,\s*255/gi,
  /rgba\(\s*0\s*,\s*0\s*,\s*0/gi,
];

export function findHardcodedColors(line, file) {
  if (/\/\/\s*theme-allow/.test(line)) return [];
  const hits = [];
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) hits.push({ token: m[0], file });
  }
  return hits;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

function main() {
  const root = "src";
  const exts = new Set([".tsx", ".ts", ".css"]);
  const findings = [];
  for (const file of walk(root)) {
    if (!exts.has(extname(file))) continue;
    if (file.replace(/\\/g, "/").endsWith("src/app/globals.css")) continue; // defines raw colors
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const hit of findHardcodedColors(line, file)) {
        findings.push(`${file}:${i + 1}  ${hit.token}`);
      }
    });
  }
  if (findings.length) {
    console.error(`\n✖ ${findings.length} hardcoded color(s) found:\n` + findings.join("\n"));
    process.exit(1);
  }
  console.log("✓ no hardcoded colors");
}

// Run only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run scripts/__tests__/check-hardcoded-colors.test.ts`
Expected: PASS.

- [ ] **Step 5: Capture the baseline** (do NOT fail the build yet — there are ~1,200 hits).

Run: `node scripts/check-hardcoded-colors.mjs > docs/superpowers/hardcoded-baseline.txt 2>&1 || true`
This baseline count is the burn-down target for Phase 3.

- [ ] **Step 6: Commit**

```bash
git add scripts/check-hardcoded-colors.mjs scripts/__tests__/check-hardcoded-colors.test.ts docs/superpowers/hardcoded-baseline.txt
git commit -m "feat(theme): add hardcoded-color static gate + baseline"
```

---

## Phase 2 — Light token definitions

### Task 8: Global light tokens in globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append the global light override block** (after the `:root {…}` block, ~line 94). Values mirror the proven microsite `getLightThemeVars()`.

```css
/* ====== LIGHT THEME (app surfaces) ====== */
:root[data-theme="light"] {
  --background: #faf9f7;
  --foreground: #141412;

  --surface-0: #faf9f7;
  --surface-1: #f4f2ee;
  --surface-2: #ebe8e3;
  --surface-3: #e2ded8;
  --surface-4: #d8d4cd;

  --border-subtle: rgba(0, 0, 0, 0.06);
  --border-default: rgba(0, 0, 0, 0.10);
  --border-strong: rgba(0, 0, 0, 0.16);
  --border-accent: rgba(160, 126, 46, 0.25);

  --text-primary: rgba(20, 20, 18, 0.92);
  --text-secondary: rgba(20, 20, 18, 0.62);
  --text-tertiary: rgba(20, 20, 18, 0.42);
  --text-muted: rgba(20, 20, 18, 0.30);

  /* gold readable on light: lean on deep gold for text/edges */
  --noddo-primary: #a07e2e;
  --noddo-primary-rgb: 160, 126, 46;

  --overlay-rgb: 0, 0, 0;
  --contrast-rgb: 20, 20, 18;

  --glass-bg: rgba(255, 255, 255, 0.60);
  --glass-bg-hover: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(0, 0, 0, 0.08);

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06);
  --shadow-xl: 0 16px 48px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08);

  --glow-xs: 0 0 12px rgba(160, 126, 46, 0.06);
  --glow-sm: 0 0 20px rgba(160, 126, 46, 0.10);
  --glow-md: 0 0 40px rgba(160, 126, 46, 0.10);
  --glow-lg: 0 0 80px rgba(160, 126, 46, 0.08);
}
```

- [ ] **Step 2: Append the marketing light override** (after the `.marketing {…}` block).

```css
/* ====== MARKETING — LIGHT ====== */
:root[data-theme="light"] .marketing {
  --mk-bg: #faf9f7;
  --mk-bg-alt: #f1eee9;
  --mk-bg-dark: #ebe8e3;
  --mk-text-primary: #141412;
  --mk-text-secondary: rgba(20, 20, 18, 0.62);
  --mk-text-tertiary: rgba(20, 20, 18, 0.42);
  --mk-text-muted: rgba(20, 20, 18, 0.30);
  --mk-border-rule: rgba(0, 0, 0, 0.08);
  --mk-border-subtle: rgba(0, 0, 0, 0.10);
  --mk-accent: #a07e2e;
  --mk-accent-light: #b8973a;
  --mk-accent-rgb: 160, 126, 46;
  --mk-accent-glow: rgba(160, 126, 46, 0.12);
  --mk-surface-2: #ebe8e3;
  --mk-surface-3: #e2ded8;
  --mk-shadow-sm: 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04);
  --mk-shadow-md: 0 4px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04);
  --mk-mid: #6b6560;
}
```

- [ ] **Step 3: Fix the hardcoded CSS utility classes** so they use tokens. In `globals.css`, change these so they invert with the theme:
  - `.input-glass { color: white; }` → `color: var(--text-primary);`
  - `.tiptap-editor.ProseMirror { color: rgba(255,255,255,0.92); }` and its `h2/h3/strong { color: white }`, `blockquote`, placeholder → token equivalents (`--text-primary`, `--text-secondary`, `--text-muted`).
  - `.login-card { background: rgba(26,26,26,0.65); }` → `background: var(--glass-bg);` and border → `var(--glass-border)`.
  - `.login-google-btn`, `.glass-panel` (uses `rgba(255,255,255,0.94)`) → tokenize.
  - global scrollbars (`::-webkit-scrollbar-thumb` `rgba(255,255,255,…)`) → `rgba(var(--contrast-rgb), …)`.
  - `.btn-ghost:hover { background: rgba(255,255,255,0.05); }` → `rgba(var(--contrast-rgb), 0.05)`.
  - `.animate-shimmer`, `.shimmer-gradient`, `.bg-noise` overlays → `rgba(var(--contrast-rgb), …)`.

- [ ] **Step 4: Manual smoke** — run `npm run dev`, visit `/` (marketing), `/dashboard`, `/admin`; toggle theme; confirm the token-driven chrome flips (backgrounds, borders, surfaces) even though hardcoded component colors are not yet converted.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(theme): define light-mode tokens for app + marketing + fix hardcoded CSS classes"
```

---

## Phase 3 — Audit & convert hardcoded colors (the bulk)

### Task 9: Author the canonical mapping table

**Files:**
- Create: `docs/superpowers/theme-color-mapping.md`

- [ ] **Step 1: Write the mapping** every conversion agent must follow. Verbatim rules:

| Hardcoded | Replace with | Notes |
|---|---|---|
| `text-white` | `text-[var(--text-primary)]` | primary copy |
| `text-white/70`, `/60` | `text-[var(--text-secondary)]` | secondary |
| `text-white/50`,`/40` | `text-[var(--text-tertiary)]` | tertiary |
| `text-white/30` and below | `text-[var(--text-muted)]` | muted |
| `text-black` | `text-[var(--surface-0)]` **only** if it's text on a gold fill; else `text-[var(--text-primary)]` | check context |
| `bg-white` | `bg-[var(--surface-0)]` | |
| `bg-white/5` | `bg-[var(--surface-2)]` | raised card |
| `bg-white/10` | `bg-[var(--surface-3)]` | |
| `bg-black`, `bg-black/90` (page bg) | `bg-[var(--surface-0)]` | |
| `bg-black/60` (overlay/scrim) | `bg-[rgba(var(--overlay-rgb),0.6)]` | modal/lightbox dim |
| `border-white/10` | `border-[var(--border-default)]` | |
| `border-white/5` | `border-[var(--border-subtle)]` | |
| `border-white/20` | `border-[var(--border-strong)]` | |
| `#141414`,`#0a0a0a` literal bg | `var(--surface-0)` | |
| `rgba(255,255,255,a)` | `rgba(var(--contrast-rgb), a)` | inverts to ink on light |
| `rgba(0,0,0,a)` overlay | `rgba(var(--overlay-rgb), a)` | stays dark scrim |
| `text-black` on `.btn-noddo`/gold | leave (button text is always dark on gold) | add `// theme-allow: gold button text` |

Genuinely theme-independent cases (photo scrims over imagery that must stay dark in both modes): keep hardcoded **and** annotate `// theme-allow: <reason>`.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/theme-color-mapping.md
git commit -m "docs(theme): canonical hardcoded→token mapping table"
```

---

### Task 10–14: Convert by surface (one task per batch)

Each batch follows the **identical procedure** below. Batches are independent and may run in parallel (separate agents). The static gate is the objective pass criterion per batch.

**Batches:**
- **Task 10 — Shared components:** `src/components/ui/`, `src/components/common/`, `src/components/motion/`. (Do this FIRST — everything imports these.)
- **Task 11 — Marketing:** `src/app/(marketing)/**` + `src/components/marketing/**`.
- **Task 12 — Dashboard:** `src/app/(dashboard)/**` + `src/components/dashboard/**`.
- **Task 13 — Platform-admin:** `src/app/(platform-admin)/**` + `src/components/admin/**`.
- **Task 14 — Microsites (Track A):** `src/app/sites/[slug]/**` + `src/components/site/**` + `src/components/portal/**`.

**Procedure (per batch):**

- [ ] **Step 1: List the batch's hits.** Run the gate scoped to the batch dir:
  `node scripts/check-hardcoded-colors.mjs 2>&1 | grep "<batch-path>"` (or temporarily point the script `root` at the batch dir).
- [ ] **Step 2: Convert** each hit per `docs/superpowers/theme-color-mapping.md`. For ambiguous cases (is this a scrim or a surface?), open the file and judge by context. Use `// theme-allow:` only for genuinely theme-independent colors.
- [ ] **Step 3: Typecheck** — `npx tsc --noEmit` → no new errors.
- [ ] **Step 4: Lint** — `npm run lint` (the batch's files) → clean.
- [ ] **Step 5: Re-run the gate** for the batch path → **zero** hits (except annotated allowances).
- [ ] **Step 6: Commit** — `git add <batch paths> && git commit -m "refactor(theme): tokenize <batch> colors for light/dark"`.

> Track A note (Task 14): the microsites already flip via `getLightThemeVars()`. The conversion here is only the hardcoded leaks. After converting, set a test project's `tema_modo` to `claro` and verify every `sites/[slug]/*` page in the browser.

---

### Task 15: Flip the gate to blocking

**Files:**
- Modify: `package.json`

- [ ] **Step 1: After all batches reach zero**, wire the gate into lint so regressions fail CI.

```json
// package.json scripts
"lint": "next lint && node scripts/check-hardcoded-colors.mjs",
"check:colors": "node scripts/check-hardcoded-colors.mjs"
```

- [ ] **Step 2: Run** `npm run lint` → passes (zero hardcoded). Delete `docs/superpowers/hardcoded-baseline.txt`.
- [ ] **Step 3: Commit** — `git commit -am "chore(theme): make hardcoded-color gate blocking in lint"`.

---

## Phase 4 — Dual-theme visual verification loop

### Task 16: Playwright route-walker (both themes)

**Files:**
- Create: `tests/e2e/theme-screenshots.spec.ts`

- [ ] **Step 1: Implement the walker.** It sets the `noddo-theme` cookie to each value, visits every public/route-enumerated page, and screenshots. (Authenticated dashboard/admin routes reuse the project's existing Playwright auth setup — see `qa-auth.py` / `playwright.config.ts` for the storageState pattern; mirror it.)

```ts
// tests/e2e/theme-screenshots.spec.ts
import { test, expect } from "@playwright/test";

const THEMES = ["light", "dark"] as const;

const PUBLIC_ROUTES = [
  "/", "/pricing", "/faq", "/nosotros", "/integraciones", "/roadmap",
  "/seguridad", "/recursos", "/casos-de-estudio", "/ayuda",
  "/legal/privacidad", "/legal/terminos", "/login", "/solicitar-demo",
];
const APP_ROUTES = [
  "/dashboard", "/proyectos", "/leads", "/cotizaciones", "/cotizador",
  "/disponibilidad", "/financiero", "/equipo", "/cuenta", "/analytics", "/bitacora",
];
const ADMIN_ROUTES = [
  "/admin", "/admin/usuarios", "/admin/proyectos", "/admin/revenue",
  "/admin/leads", "/admin/facturacion", "/admin/health", "/admin/storage",
  "/admin/emails", "/admin/errores", "/admin/moderacion", "/admin/citas",
  "/admin/webhooks", "/admin/actividad", "/admin/admins",
];

for (const theme of THEMES) {
  test.describe(`theme:${theme}`, () => {
    test.use({
      // set cookie before each navigation
      storageState: undefined,
    });
    for (const path of PUBLIC_ROUTES) {
      test(`${theme} ${path}`, async ({ context, page, baseURL }) => {
        await context.addCookies([{
          name: "noddo-theme", value: theme,
          url: baseURL ?? "http://localhost:3000",
        }]);
        await page.goto(path, { waitUntil: "networkidle" });
        await expect(page).toHaveScreenshot(
          `${theme}${path.replace(/\//g, "_") || "_home"}.png`,
          { fullPage: true, maxDiffPixelRatio: 0.02 }
        );
      });
    }
  });
}
// APP_ROUTES / ADMIN_ROUTES: add a describe block that loads the authed storageState
// produced by the existing auth setup, then the same cookie+goto+screenshot loop.
```

- [ ] **Step 2: Run** `npx playwright test tests/e2e/theme-screenshots.spec.ts` against `npm run dev`. First run generates baselines; review the screenshots directory as a contact sheet.
- [ ] **Step 3: Commit** — `git add tests/e2e/theme-screenshots.spec.ts && git commit -m "test(theme): dual-theme route screenshot walker"`.

---

### Task 17: The 100% loop

- [ ] **Step 1:** Review the screenshot contact sheet for BOTH themes, every route. Flag: illegible text (contrast), invisible borders, wrong-colored surfaces, scrims that vanish, gold-on-light failures.
- [ ] **Step 2:** For each flagged page, fix the offending component (convert remaining hardcoded color, adjust a token, or add a scoped light override). Re-run the gate (`npm run check:colors`).
- [ ] **Step 3:** Re-run Playwright for the fixed routes.
- [ ] **Step 4:** Repeat Steps 1–3 until: (a) `npm run check:colors` is green, (b) `npm run lint` + `npx tsc --noEmit` clean, (c) zero visual/contrast defects across all routes in both themes.
- [ ] **Step 5: Final commit** — `git commit -am "feat(theme): light/dark verified 100% across all surfaces"`.

**Definition of done:** static gate green · tsc/lint clean · every route screenshot-verified in light AND dark with no contrast/legibility defects (WCAG AA).

---

## Self-Review (completed)

- **Spec coverage:** mechanism+no-FOUC (T2–T4), default OS/dark fallback (T2), cookie+profile persistence (T4–T5), toggle UI (T6), light tokens app+marketing (T8), accessibility/gold rule (T8 + mapping T9), audit/convert all surfaces (T10–T14), microsites audit-only (T14), static gate (T7,T15), Playwright dual-theme + loop (T16–T17). ✓ all spec sections mapped.
- **Placeholder scan:** conversion batches intentionally reference the mapping table (T9) rather than inlining 1,200 edits — the procedure + objective gate define done. No vague "handle edge cases".
- **Type consistency:** `Theme`, `THEME_COOKIE`, `resolveTheme`, `useTheme`, `ThemeToggle`, `findHardcodedColors` names used consistently across tasks.
