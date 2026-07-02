# Agent-Only Microsite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public microsite an agent-only sales tool: no public quoting or contact channels, agent-mode cotización uses the full dashboard tool, and the Recursos PDF viewer actually opens PDFs on microsite domains.

**Architecture:** All changes are in the microsite layer (`src/app/sites/[slug]/*`, `src/components/site/*`) plus one middleware-matcher fix. The existing agent-mode system (`useAgentMode`) is the gate; the existing `AgentCotizadorModal` (which mounts the dashboard `CotizadorTool`) becomes the only quotation experience. No schema changes.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, TypeScript strict, react-pdf 10.4.1 (pdfjs-dist 5.4.296 transitive), Supabase.

**Spec:** `docs/superpowers/specs/2026-07-02-agent-only-microsite-design.md`

## Global Constraints

- TypeScript strict; **no `any`**; no lint suppression comments (hookify blocks them).
- Verification gate = `npx tsc --noEmit -p tsconfig.json` and `npm run lint` (CI runs typecheck+lint+build).
- Git author: `git -c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com" commit ...`
- **Never push to `main` without Master's explicit OK.** Work lands on a feature branch; deploy = clean cherry-pick of only these commits onto `origin/main` (established flow).
- Push credential trick (GCM caches the wrong user): `git -c credential.helper= -c "credential.helper=!gh auth git-credential" -c credential.https://github.com.username=juanj34 push ...`
- This repo has no unit-test harness for these microsite page components; verification is typecheck + lint + live browser checks (agent-browser) after deploy.

## Root causes already diagnosed (do not re-derive)

1. **Recursos PDFs don't open on microsite domains**: `src/middleware.ts` matcher excludes `js|css|png|...` but **not `mjs`**, so on subdomains/custom domains `/pdf.worker.min.mjs` is rewritten to `/sites/<slug>/pdf.worker.min.mjs` → 404 HTML → pdf.js real worker fails → "fake worker" dynamic import also 404 → viewer shows "No se pudo cargar el documento". Confirmed live on `indigo-houses.noddo.io` (worker fetch = 404 HTML; on apex `noddo.io` it is 200).
2. The `postinstall` `cp` that copies the worker into `public/` is Unix-only (fails silently on Windows dev) and version-drift-prone.
3. `CotizadorModal` is a dual switch: agent mode → `AgentCotizadorModal` (dashboard `CotizadorTool`); public → `CotizadorFlowMultiStep`. The public branch is being retired.

## Setup: work branch

- [ ] **Step 0.1: Create the work branch from origin/main**

```bash
cd C:/dev/NODDO-SALES
git fetch origin
git checkout -b feat/agent-only-microsite origin/main
```

Expected: new branch at origin/main tip. (Sessions share this checkout — verify `git status --short` shows no staged files before starting; unrelated untracked docs are fine.)

---

### Task 1: PDF worker — bundler-resolved worker + middleware `.mjs` exclusion

**Files:**
- Modify: `src/components/site/PDFPresentationViewer.tsx:21`
- Modify: `src/components/site/PDFScrollViewer.tsx:13`
- Modify: `src/middleware.ts:211-214` (matcher)
- Modify: `package.json:23` (remove postinstall)

**Interfaces:**
- Consumes: `react-pdf`'s `pdfjs` export; `pdfjs-dist/build/pdf.worker.min.mjs` (hoisted transitive dep, verified present at `node_modules/pdfjs-dist/build/`).
- Produces: nothing consumed by later tasks (independent fix).

- [ ] **Step 1.1: Point both viewers at the bundler-emitted worker**

In `src/components/site/PDFPresentationViewer.tsx`, replace line 21:

```ts
// BEFORE
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// AFTER — bundler emits the worker under /_next/static (never rewritten by
// middleware, always version-matched to the installed pdfjs-dist)
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();
```

Apply the identical replacement in `src/components/site/PDFScrollViewer.tsx` line 13.

- [ ] **Step 1.2: Exclude `.mjs` from the middleware matcher**

In `src/middleware.ts`, the `config.matcher` entry:

```ts
// BEFORE
"/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",

// AFTER (adds mjs)
"/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|mjs|woff|woff2)$).*)",
```

- [ ] **Step 1.3: Remove the flaky postinstall copy**

In `package.json`, delete line 23:

```json
"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs 2>/dev/null || true"
```

(Leave the `.gitignore` entry `/public/pdf.worker.min.mjs` — it protects against stale local copies being committed.)

- [ ] **Step 1.4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 1.5: Commit**

```bash
git add src/components/site/PDFPresentationViewer.tsx src/components/site/PDFScrollViewer.tsx src/middleware.ts package.json
git -c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com" commit -m "fix(pdf): bundle pdfjs worker via import.meta.url; exclude .mjs from middleware rewrite" -m "On subdomains the middleware rewrote /pdf.worker.min.mjs into /sites/<slug>/... (matcher lacked mjs) -> 404 -> react-pdf fake-worker fallback also 404 -> 'No se pudo cargar el documento'. Resolve the worker through the bundler (version-matched, served under /_next/static) and drop the Unix-only postinstall copy." -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Cotización → agent-only, single experience

**Files:**
- Modify: `src/app/sites/[slug]/inventario/page.tsx` (~lines 107, 1011, 1231)
- Modify: `src/app/sites/[slug]/tipologias/page.tsx` (~lines 159, 996-1004)
- Modify: `src/app/sites/[slug]/explorar/page.tsx` (~lines 155, 567, 790)
- Rewrite: `src/components/site/CotizadorModal.tsx` (681 → ~45 lines)
- Delete: `src/components/site/CotizadorFlowMultiStep.tsx`

**Interfaces:**
- Consumes: `useAgentMode()` from `@/hooks/useAgentMode` → `{ isAgentMode: boolean }`; `AgentCotizadorModal` from `@/components/site/AgentCotizadorModal` with props `{ open: boolean; onClose: () => void }`.
- Produces: `CotizadorModal` keeps its exact public props interface (callers unchanged): `{ isOpen, onClose, unidad, tipologia, proyectoId, cotizadorConfig?, cotizadorEnabled?, availableTipologias?, tipoProyecto? }`.

- [ ] **Step 2.1: Rewrite `CotizadorModal.tsx` as the agent-only shim**

Replace the entire file content with:

```tsx
"use client";

import { useAgentMode } from "@/hooks/useAgentMode";
import { AgentCotizadorModal } from "@/components/site/AgentCotizadorModal";
import type { Unidad, Tipologia, CotizadorConfig } from "@/types";

/**
 * Quotation entry point on the microsite.
 *
 * Quotes are an agent-only capability (platform decision 2026-07-02): the
 * public flow was retired, and agent mode mounts the full dashboard
 * CotizadorTool via AgentCotizadorModal. Props are kept identical to the
 * old public modal so callers don't change; non-agent renders nothing.
 */
interface CotizadorModalProps {
  isOpen: boolean;
  onClose: () => void;
  unidad: Unidad;
  tipologia: Tipologia | undefined;
  proyectoId: string;
  cotizadorConfig?: CotizadorConfig | null;
  cotizadorEnabled?: boolean;
  /** Available tipologías for multi-tipo lots (tipologia_mode === 'multiple') */
  availableTipologias?: Tipologia[];
  /** Project type — used for lotes pricing logic */
  tipoProyecto?: string;
}

export function CotizadorModal(props: CotizadorModalProps) {
  const { isAgentMode } = useAgentMode();
  if (!isAgentMode) return null;
  return <AgentCotizadorModal open={props.isOpen} onClose={props.onClose} />;
}
```

Note: props beyond `isOpen`/`onClose` are intentionally accepted-but-unused via the non-destructured `props` object (destructuring them would trip `no-unused-vars`; the interface must stay stable for the three callers). `AgentCotizadorModal` reads the unit context from `useSiteProject()` itself.

- [ ] **Step 2.2: Delete the retired public flow**

```bash
git rm src/components/site/CotizadorFlowMultiStep.tsx
```

Then confirm nothing else imports it: `grep -rn "CotizadorFlowMultiStep" src --include="*.ts*"` → expected: no matches.

- [ ] **Step 2.3: Gate the Cotizar buttons in `inventario/page.tsx`**

Add the hook import (top of file, with the other `@/hooks` imports):

```tsx
import { useAgentMode } from "@/hooks/useAgentMode";
```

Inside the component (near `const [cotizarUnidad, setCotizarUnidad] = useState<Unidad | null>(null);` at ~line 107):

```tsx
const { isAgentMode } = useAgentMode();
```

Wrap BOTH Cotizar buttons (Sparkles icon, ~line 1011 and ~line 1231) in the agent gate. Pattern for each:

```tsx
{isAgentMode && (
  <button
    onClick={() => setCotizarUnidad(unit)}
    className="p-1.5 rounded-lg text-[var(--site-primary)] hover:text-white bg-[rgba(var(--site-primary-rgb),0.15)] hover:bg-[rgba(var(--site-primary-rgb),0.30)] transition-all cursor-pointer"
    aria-label={tSite("inventario.enquireUnit", { unit: unit.identificador })}
  >
    <Sparkles size={13} />
  </button>
)}
```

(Keep each button's existing className/size exactly as found — only add the `{isAgentMode && (...)}` wrapper.)

- [ ] **Step 2.4: Gate the Cotizar button in `tipologias/page.tsx`**

Same hook import + `const { isAgentMode } = useAgentMode();`. Wrap the single Cotizar button (~line 996, `btn-warm` with `tipologias.enquire` label):

```tsx
{isAgentMode && (
  <button
    onClick={() => setCotizarUnidad(selectedUnit)}
    className="flex-shrink-0 btn-warm px-5 py-2.5 flex items-center gap-2 text-xs tracking-wider cursor-pointer"
  >
    <Sparkles size={14} />
    {tSite("tipologias.enquire")}
  </button>
)}
```

- [ ] **Step 2.5: Gate the Cotizar buttons in `explorar/page.tsx`**

Same hook import + `const { isAgentMode } = useAgentMode();`. Wrap the two `setCotizarUnidad(selectedUnit)` buttons (~lines 567 and 790) with `{isAgentMode && (...)}`, preserving their existing markup.

- [ ] **Step 2.6: Typecheck + lint**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: both exit 0. (If lint flags unused imports left behind in the three pages — e.g. `Sparkles` still used, but check — remove only genuinely unused ones.)

- [ ] **Step 2.7: Commit**

```bash
git add src/components/site/CotizadorModal.tsx src/app/sites/[slug]/inventario/page.tsx src/app/sites/[slug]/tipologias/page.tsx src/app/sites/[slug]/explorar/page.tsx
git -c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com" commit -m "feat(microsite): quotation is agent-only — retire public cotizador flow" -m "Cotizar buttons render only in agent mode; CotizadorModal is now a thin shim over AgentCotizadorModal (full dashboard CotizadorTool). CotizadorFlowMultiStep deleted." -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

(Note: `git rm` already staged the deletion in Step 2.2.)

---

### Task 3: Remove Contacto (nav + route)

**Files:**
- Modify: `src/components/site/SiteNav.tsx:104` (+ unused `MessageCircle` import if applicable)
- Rewrite: `src/app/sites/[slug]/contacto/page.tsx` (redirect stub)

**Interfaces:**
- Consumes: `useSiteBasePath()` from `@/hooks/useSiteProject` (returns the microsite base path string); `useRouter` from `next/navigation`.
- Produces: `/contacto` on any microsite silently redirects home; no nav entry.

- [ ] **Step 3.1: Remove the nav item**

In `src/components/site/SiteNav.tsx`, delete line 104:

```tsx
{ label: tNav("contacto"), href: "/contacto", Icon: MessageCircle },
```

Then check `MessageCircle` usage in the file: `grep -n "MessageCircle" src/components/site/SiteNav.tsx` — if only the import remains, remove it from the lucide-react import list.

- [ ] **Step 3.2: Replace the contacto page with a redirect stub**

Replace the entire content of `src/app/sites/[slug]/contacto/page.tsx` with:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSiteBasePath } from "@/hooks/useSiteProject";

/**
 * Public contact was removed platform-wide (2026-07-02): the microsite is an
 * agent sales tool, not a self-service funnel. Old /contacto links redirect
 * to the microsite home instead of 404ing.
 */
export default function ContactoPage() {
  const basePath = useSiteBasePath();
  const router = useRouter();

  useEffect(() => {
    router.replace(basePath);
  }, [router, basePath]);

  return null;
}
```

Verify the hook exists first: `grep -n "useSiteBasePath" src/hooks/useSiteProject.ts*` — expected: an exported hook. If it does not exist, use `useSiteProject()` and build the path as `` `/sites/${proyecto.slug}` `` (same value the layout passes as `basePath`).

- [ ] **Step 3.3: Typecheck + commit**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

```bash
git add src/components/site/SiteNav.tsx src/app/sites/[slug]/contacto/page.tsx
git -c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com" commit -m "feat(microsite): remove public Contacto section (nav + route redirects home)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Remove the WhatsApp floating button

**Files:**
- Modify: `src/app/sites/[slug]/SiteLayoutClient.tsx:15,143-149`

**Interfaces:**
- Consumes: nothing new.
- Produces: no public direct-contact channel on the microsite.

- [ ] **Step 4.1: Remove the render and the import**

In `src/app/sites/[slug]/SiteLayoutClient.tsx` delete the block (~lines 143-149):

```tsx
{/* WhatsApp floating button — non-landing pages when number is configured */}
{!isLanding && proyecto.whatsapp_numero && (
  <WhatsAppButton
    numero={proyecto.whatsapp_numero}
    proyectoId={proyecto.id}
  />
)}
```

and the import (line 15):

```tsx
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
```

(Leave `src/components/site/WhatsAppButton.tsx` on disk — it has no other consumers but deleting it is not required; keep the diff minimal. `proyecto.whatsapp_numero` stays in the schema.)

- [ ] **Step 4.2: Typecheck + commit**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

```bash
git add src/app/sites/[slug]/SiteLayoutClient.tsx
git -c user.name="juanj34" -c user.email="juanjaramillo34@gmail.com" commit -m "feat(microsite): remove public WhatsApp floating button (no self-contact)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Full gate + deploy to production

**Files:** none new — verification, cherry-pick to main, deploy watch.

- [ ] **Step 5.1: Full local gate**

Run: `npx tsc --noEmit -p tsconfig.json && npm run lint`
Expected: both exit 0.

- [ ] **Step 5.2: Push the feature branch (backup)**

```bash
git -c credential.helper= -c "credential.helper=!gh auth git-credential" -c credential.https://github.com.username=juanj34 push -u origin feat/agent-only-microsite
```

- [ ] **Step 5.3: CHECKPOINT — get Master's explicit OK to deploy to main**

Do not proceed without it (repo rule: never push to main without OK).

- [ ] **Step 5.4: Land only these commits on main**

```bash
git fetch origin
git checkout -B deploy/agent-only origin/main
git cherry-pick <task1-sha> <task2-sha> <task3-sha> <task4-sha>
git diff --stat origin/main HEAD   # expect ONLY the files listed in Tasks 1-4
git -c credential.helper= -c "credential.helper=!gh auth git-credential" -c credential.https://github.com.username=juanj34 push origin HEAD:main
git checkout feat/agent-only-microsite
git branch -D deploy/agent-only
```

- [ ] **Step 5.5: Watch the Vercel prod deploy until READY**

Use the established watcher (Vercel API, project `prj_PQCHDGbraWsxbuRFgJjYl3TWxdHc`, token `~/.claude/secrets/noddo-vercel-token.token`, match the pushed sha, poll `readyState` until `READY`).

---

### Task 6: Live verification (agent-browser)

**Files:** none — browser checks against `https://indigo-houses.noddo.io`.

- [ ] **Step 6.1: Public — PDF viewer works**

```bash
agent-browser open "https://indigo-houses.noddo.io/recursos"
agent-browser snapshot -i          # find VER button ref
agent-browser click @eN            # VER on any PDF resource
# wait ~6s, then:
agent-browser console              # expect NO "Setting up fake worker"
agent-browser screenshot pdf-ok.png
```

Expected: screenshot shows rendered PDF pages (not "No se pudo cargar el documento").

- [ ] **Step 6.2: Public — no cotizar / contacto / WhatsApp**

```bash
agent-browser open "https://indigo-houses.noddo.io/inventario"
agent-browser snapshot -i
```

Expected: no Cotizar/Sparkles enquiry buttons, no CONTACTO nav link, no WhatsApp floating button anywhere. Also `https://indigo-houses.noddo.io/contacto` redirects to the microsite home.

- [ ] **Step 6.3: Agent mode — cotizador is the dashboard tool**

Log in via the agent login (Settings/agent entry in nav) with a project-authorized agent account (Master provides credentials or does this check himself). Expected: Cotizar buttons appear; clicking one opens the fullscreen dashboard `CotizadorTool`.

- [ ] **Step 6.4: Report results to Master**

Include screenshots and any deviation.

---

### Task 7 (ops, independent — can run any time): content + cotización-PDF verification

- [ ] **Step 7.1: Remove the "Planimetría" resource from Índigo Houses**

Via API against prod data (authorized): find the resource id (`recursos` table, proyecto Índigo Houses, nombre `Planimetría`) and delete via the dashboard editor UI or `DELETE /api/recursos/[id]` as an authenticated admin. If neither is practical, delete the row via the Supabase Management API (`delete from recursos where id = '<id>';`) — confirm with Master first since it's a prod data mutation.

- [ ] **Step 7.2: Verify the cotización PDF pipeline end-to-end**

In agent mode (or the dashboard), create ONE test cotización and confirm `pdf_url` is populated (render worker at `COTIZADOR_RENDER_URL` now wired in Vercel). If `pdf_url` stays null, capture the worker/API error from `error_logs` (route filter) and report — fixing the worker is a separate task, not this plan.

---

## Self-review notes

- Spec coverage: A→Task 2, B→Task 3, C→Task 4, D→Task 1, E→Step 7.2, F→Step 7.1. Rollout→Tasks 5-6. ✔
- The `hasPlanPago` nav prop and `secciones_visibles.contacto` are intentionally untouched (spec: backward-compat, no migration).
- `AgentModeIndicator` and agent login entry points in `SiteNav` are untouched — agents still log in the same way.
