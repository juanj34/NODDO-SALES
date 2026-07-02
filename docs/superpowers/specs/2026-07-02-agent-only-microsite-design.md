# Design: Microsite as an agent-only sales tool

**Date:** 2026-07-02
**Status:** Approved (pending spec review)
**Author:** Master + Claude

## Goal

Reposition the public microsite (`/sites/[slug]/*`) from a **self-service consumer funnel** into an **agent-driven sales tool**. The public visitor can browse the project (gallery, typologies, inventory, location, resources, brochure) but **cannot self-quote or self-contact**. Quotes are produced by sales agents using the full quotation tool already built for the dashboard. This becomes the **platform default for all projects**, not a per-project toggle.

## Decisions (locked)

| Topic | Decision |
|---|---|
| Cotización | Agents only. Available inside the microsite in **agent mode**, using the full dashboard `CotizadorTool`. Public self-quote removed. |
| Scope | **Platform default** — applies to all projects. |
| Contacto | **Removed entirely** (nav + route + public lead form). |
| WhatsApp button | **Removed entirely** — no public direct-contact channel. |
| Recursos PDFs | Keep current viewer; **fix the bug** where no PDF opens. |
| Cotización PDF | **Verify** the (now-wired) render worker actually produces a PDF. |
| Planimetría (Índigo Houses) | Remove the resource (content op). |

## Current architecture (relevant facts)

- **Agent mode already exists.** `AgentModeProvider` (`hooks/useAgentMode.tsx`) wraps every microsite. A logged-in, project-authorized agent (`/api/agent-mode/verify`) gets `isAgentMode = true`, which overrides project visibility (`mostrar_precios`, `mostrar_vendidas`, `mostrar_todas_secciones`, `habilitar_cotizador → cotizador_enabled = true`).
- **The cotización switch.** Microsite pages (inventario, tipologias, explorar) render `<CotizadorModal>`. `CotizadorModal` (site) is a switch: if `isAgentMode` it renders `<AgentCotizadorModal>` which mounts the **dashboard `CotizadorTool`** (`components/dashboard/cotizador/CotizadorTool.tsx`, ~2900 lines) inside a modal; otherwise it renders the simpler public flow `CotizadorFlowMultiStep`. **This dual behavior is the confusion to remove.**
- **Cotizar triggers.** "Cotizar" buttons call `setCotizarUnidad(unit)`; the modal is opened with `cotizadorEnabled={proyecto.cotizador_enabled}`.
- **Contacto.** Nav item in `SiteNav.tsx` (`{ href: "/contacto" }`), route `sites/[slug]/contacto/page.tsx`, public `LeadForm`. Section is also in `secciones_visibles`.
- **WhatsApp.** Rendered in `SiteLayoutClient.tsx`: `{!isLanding && proyecto.whatsapp_numero && <WhatsAppButton/>}`.
- **Recursos PDF viewer.** `PDFPresentationViewer.tsx` / `PDFScrollViewer.tsx` use `react-pdf` with `pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"`. That file is produced by a `postinstall` `cp` (fragile, cross-platform + version-drift) and is effectively missing/mismatched → the worker fails → PDFs don't render.
- **Cotización PDF.** `COTIZADOR_RENDER_URL` + `RENDER_SHARED_SECRET` are now set in Vercel (worker wired), but 0 of 8 existing cotizaciones have a `pdf_url` → unverified.

## Changes

### A. Cotización → agent-only (one experience)
- Gate the **"Cotizar" trigger buttons** (inventario, tipologias, explorar) behind `isAgentMode` (via `useAgentMode`). The public never sees a Cotizar action.
- With the trigger gated, `CotizadorModal` is only ever opened in agent mode → it always resolves to `AgentCotizadorModal` (the dashboard `CotizadorTool`). **Retire the public branch**: remove the `CotizadorFlowMultiStep` path from `CotizadorModal` (and delete `CotizadorFlowMultiStep.tsx` if unused elsewhere).
- Net result: exactly **one** quotation experience — the full dashboard tool — reachable only by agents inside the microsite. Matches "modo agente cargando todo el dashboard de cotizaciones."
- Dashboard cotización surfaces (`/cotizador`, `/cotizaciones`, `editor/[id]/cotizador`) are unchanged; they remain the internal home of the tool.

### B. Contacto → removed platform-wide
- Remove the `contacto` nav item from `SiteNav.tsx`.
- Remove/neutralize the route `sites/[slug]/contacto/page.tsx` (redirect to the microsite home, so old links don't 404).
- Stop rendering the public `LeadForm` on the microsite. (`LeadForm` component may remain for potential future internal use, but has no public entry point.)
- Leave `secciones_visibles.contacto` in the type for backward-compat; it no longer surfaces a public section. (No migration required.)

### C. WhatsApp button → removed
- Remove the `<WhatsAppButton>` render from `SiteLayoutClient.tsx`. No public direct-contact channel remains on the microsite.

### D. Recursos PDF viewer → fix
- Replace the fragile `postinstall`-copied worker with **reliable, version-matched worker resolution** so `react-pdf` renders. Preferred: resolve the worker from the installed `pdfjs-dist` via the bundler (e.g. `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`) so the worker version always matches `pdfjs.version`, eliminating both "worker missing" and "API/Worker version mismatch". Fix in both `PDFPresentationViewer.tsx` and `PDFScrollViewer.tsx`. Remove/repair the flaky `postinstall` copy.
- Verify "VER" opens a PDF on the live microsite after deploy.

### E. Cotización PDF verification (no code, ops)
- Create one test cotización through the tool and confirm a `pdf_url` is produced by the render worker; if it fails, capture the worker error and fix the wiring. (Separate from the UI refactor.)

### F. Content op — Índigo Houses
- Remove the "Planimetría" resource from Índigo Houses (editor UI or `/api/recursos/[id]`).

## Data / behavior implications
- No schema changes. `cotizador_enabled`, `agent_mode_config`, `secciones_visibles` remain; their public effect for cotizar/contacto is superseded by the agent-only gating.
- Existing projects immediately adopt the new default on deploy: public loses cotizar/contacto/WhatsApp; agents keep full cotización.

## Testing / verification
- Type-check (`tsc --noEmit`) + lint.
- Manual/live: (1) public microsite shows no Cotizar buttons, no Contacto nav, no WhatsApp; (2) agent login → Cotizar opens the full dashboard tool; (3) Recursos "VER" opens a PDF; (4) a test cotización yields a PDF.

## Rollout
- Ship via the established flow: commit the UI/viewer changes, land only those files on `main` (clean cherry-pick), Vercel prod deploy, verify live. Content op (Planimetría) and the cotización-PDF verification run independently.

## Out of scope
- Redesigning the `CotizadorTool` itself.
- Per-project re-enabling of public cotización/contacto (could return later as an explicit opt-in toggle; not now).
- Lead-capture/CRM changes outside the microsite.
