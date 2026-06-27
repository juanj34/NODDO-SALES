# NODDO Cotizador — Server-side render service (design spec)

**Status:** Approved direction (2026-06-25). Ready for implementation planning.

**Goal:** Make the cotizador "just work" and produce a premium, per-developer customizable quote PDF, by moving PDF generation out of the Vercel serverless route into a dedicated HTML→Chromium render worker on Railway — reusing the existing pricing engine and per-project config, fixing the known pricing/PII bugs along the way.

**Architecture (one line):** The NODDO app computes the quote (existing `calcular.ts`), builds a self-contained premium HTML document from the developer's `cotizador_config`, POSTs the HTML to a generic Railway Chromium worker that returns PDF bytes, stores the PDF in a **private** Supabase bucket, and serves it via short-lived signed URLs (agent dashboard + buyer microsite + email).

**Tech stack:** Next.js 16 / React 19 / TS (app), Node + headless Chromium (worker, Railway), Supabase Postgres + Storage, Resend (email). Mirrors the proven peptides `plan-render` worker pattern.

---

## 1. Context & current state (verified)

**Reference pattern (peptides `plan-render`, already in production):**
- Worker `render-worker/plan-render-server.mjs`: plain Node HTTP server. `GET /health` → ok; `POST /render` (HTML body) → headless Chromium `--print-to-pdf` (`--no-sandbox --disable-dev-shm-usage` for Linux/Railway) → returns PDF bytes. Deployed as a Railway service; URL in `PLAN_RENDER_URL`.
- Builder `lib/recommendation/plan-html.ts` (pure): data → self-contained HTML.
- Service `lib/recommendation/plan-service.ts`: `buildHtml(buildData(...))` → POST to worker → upload to private Supabase bucket → `createSignedUrl` → email via Resend. Fire-and-forget wrapper swallows worker outages so the main flow never breaks.

**Current NODDO cotizador (to reuse / replace):**
- Pricing engine `src/lib/cotizador/calcular.ts` (base → discounts → complementos → payment phases fijo/porcentaje/resto with cuotas/frequency/delivery scaling → cargos). **Source of truth — keep, fix bugs.**
- Per-project config: `proyectos.cotizador_config` (jsonb) + `cotizador_enabled` (bool). Edited via `PlantillaEditor` / `PlantillasTab`: payment templates (`plantillas_pago` — filas %/fijo/resto + date rules + frequency + separación), `cargos_adicionales` (IVA/DLD/admin), `notas_legales`, currency, delivery type, per-template `es_default` / `habilitada_micrositio`. **This is the personalization model — structured config, not free-form layout.**
- PDF generation: `src/lib/cotizador/pdf-react/document.tsx` (@react-pdf/renderer) + `generar-pdf.ts` (jsPDF fallback), invoked inside the Vercel serverless routes `POST /api/cotizaciones`, `/preview`, `/[id]/regenerate`, `/[id]/resend`, and the public microsite quick-quote. **Replace the renderer; keep the routes.**
- `cotizaciones` table (verified live): `id, proyecto_id, unidad_id, nombre, email, telefono` (buyer PII), `unidad_snapshot/config_snapshot/resultado` (jsonb), `pdf_url`, `utm_*`, `agente_*`. **7 real rows exist.** Reuse; store an object **path** in `pdf_url` (not a public URL).

**Verified DB state (NODDO-SALES-ROOM, ref `enmtlrrfvwuzxfqjnton`, via Management API):** 145 migrations applied (current with repo), 49 public tables, 6 projects (1 with `cotizador_enabled`). **Storage has only the `media` bucket (public); there is NO `uploads` bucket** that the code writes cotización PDFs to → current PDF storage is broken/unprovisioned in prod, and any PDFs that did land in `media` are publicly exposed. This redesign creates a dedicated **private** bucket.

---

## 1.1 Confirmed problem + owner requirements (2026-06-26)

**The PDF pipeline is currently DEAD in production.** Every `cotizaciones` row has `pdf_url = NULL` — the @react-pdf output is uploaded to the non-existent `uploads` bucket (`route.ts:624`, path `cotizaciones/{proyecto}/{id}.pdf`), so the upload fails and no PDF is ever stored. Agents get the on-screen result (e.g. $660.000.000) but **cannot download or email a PDF**. The Resend path (`/[id]/resend/route.ts:50`) does `fetch(pdf_url)` → fails on null. So this redesign is not "improve the PDF" — it **makes the PDF work at all**, then makes it premium.

**Owner requirements — NodDo Quote agent flow:**
- **Immediate PDF download** the instant a quote is created (the "Cotización generada" success card must offer a working "Descargar PDF" so the agent has it on screen, sitting with the client).
- **Email the client via Resend** ("su cotización del proyecto") — verify `RESEND_API_KEY` is set in NODDO's Vercel and that the send actually fires.
- **Persist the generated PDF** so it is re-downloadable from the cotizaciones list.

**Owner requirements — PDF quality (varies a LOT per project and per number of cuotas):**
- **No overlapping elements (no overlay).**
- **No excess white space.**
- **Tables MUST NOT break across pages** — a payment-plan table with many cuotas paginates cleanly: the header row repeats on each page and no row splits mid-row (`page-break-inside: avoid`, `thead { display: table-header-group }`). This is a primary reason HTML→Chromium beats @react-pdf.
- **Project renders** (images) included.
- **The quoted typology's floor plan (plano)** included.
- Robust across the real projects (Hito 18, Índigo Houses, Garden Houses, The Meriva Collection, Alto de Yeguas) and any number of cuotas. **Each project's output is reviewed before sign-off.**

---

## 2. Components

### C1 — Render worker `noddo-render` (Railway, generic)
A generic, app-agnostic HTML→PDF service (no NODDO/cotización specifics baked in — the app sends fully self-contained HTML).
- `GET /health` → `200 ok`.
- `POST /render` — body = HTML (text/plain) or `{html}` (json); optional `{format?: "A4"|"Letter", landscape?: bool, scale?: number}`; returns `application/pdf` bytes, or `4xx/5xx` JSON `{error}` on failure.
- Headless Chromium via `--print-to-pdf` with `--no-sandbox --disable-dev-shm-usage --headless=new` (required as root-in-container on Linux). `CHROME_PATH` env (chromium in the image).
- Light sanity gate only: PDF created + size > a floor (catches blank/stripped renders) + ≥1 page. **No** app-specific audit (that lived in peptides because the plan worker was plan-specific; NODDO's worker stays generic and reusable "para lo que sea necesario").
- Auth: a shared secret header (`x-render-token`, env `RENDER_SHARED_SECRET`) so the worker isn't an open PDF endpoint. CORS off (server-to-server only).
- Deploy artifacts in repo at `render-worker/`: `Dockerfile` (`node:20-slim` + `chromium` + brand fonts), `railway.json` (DOCKERFILE builder + `/health` healthcheck), `server.mjs` (the worker), README. Modeled on peptides `render-worker/`.

### C2 — HTML builder `src/lib/cotizador/html/` (pure, no IO)
- `buildCotizacionData(input)` → a normalized, render-ready `CotizacionView` (resolves unidad snapshot + the selected `plantilla_pago` + `cargos_adicionales` + branding + agent + the **pricing result from `calcular.ts`**, with currency formatting and dual-currency display).
- `buildCotizacionHtml(view)` → one **self-contained premium HTML string**: inline CSS, brand fonts embedded as base64 `@font-face` (Cormorant/Syne/Inter/DM Mono), logo + images as base64 or absolute public URLs. No external/relative asset refs (worker renders from a temp file). Uses the NODDO design language (forest/champagne, the four brand fonts).
- **Premium, data-driven layout** (sections render/condense based on config): cover (project + branding + unidad + **project render**), price summary (neto, discounts, **cargos summed into a correct grand total**), **payment-plan table** (the `plantilla_pago` filas with dates/amounts/%, dual currency — **never split across pages; header repeats; rows never break mid-row** regardless of cuota count), **project renders gallery**, **the quoted typology's floor plan (plano)**, delivery, agent contact card, legal notes, footer. **No overlays, no excess white space.** Replaces `pdf-react/document.tsx`. The exact visual styling is iterated with mockups during implementation (see §6), reviewed per real project.

### C3 — Pricing correctness (`calcular.ts` + builder)
Fold in the confirmed cotizador bugs (see the existing plan `2026-06-25-cotizador-correctness.md`):
- Honor `precio_negociado` everywhere the saved/emailed/displayed quote and the payment phases are computed (not list price).
- Add a canonical, always-defined grand total that **includes `cargos_adicionales`** (IVA/admin/DLD), and the invariant **sum(payment phases) == grand total**. Colombia construction generally has **no IVA**, so cargos are usually empty — but where configured they must be part of what the buyer owes and what the phases sum to. (Confirm per-tenant cargo semantics with the owner if any non-empty cargo appears.)
- The HTML builder consumes this single corrected result; the PDF, the persisted `resultado`, the email, and the webhook payload all show the same numbers.

### C4 — Generation service `src/lib/cotizador/generate.ts`
- `buildCotizacionHtml(buildCotizacionData(...))` → `renderPdf(html)` (POST to `COTIZADOR_RENDER_URL` with `RENDER_SHARED_SECRET`) → PDF buffer.
- Upload to **private** bucket `cotizaciones` at key `${proyecto_id}/${cotizacion_id}.pdf` (service-role client). Store the **object path** in `cotizaciones.pdf_url` (not a public URL).
- `getCotizacionSignedUrl(path)` mints a short-lived signed URL on demand for dashboard display/download.
- Email to buyer via Resend with the PDF **attached** (buffer) — no permanent link leaked; optional time-boxed signed link.
- Worker outage handling: fail soft on the buyer/public path (return the quote record without a PDF + retry hook), fail loud on the agent "generate PDF" action (surface the error).

### C5 — Private storage bucket (migration)
- New migration: create private bucket `cotizaciones` (public=false) + storage RLS (owner/collaborator read via the project, service-role write). Version-controlled (the current `media`-only / missing-`uploads` state is dashboard drift).
- One-time: migrate the 7 existing `cotizaciones.pdf_url` rows if they point at a real object; otherwise leave (they can be regenerated). PII PDFs must not remain in the public `media` bucket.

### C6 — Wiring (reuse routes, swap renderer)
- `POST /api/cotizaciones`, `/preview`, `/[id]/regenerate`, `/[id]/resend`, and the public microsite quick-quote call **C4** instead of @react-pdf. `regenerate` renders from the STORED snapshot (don't silently re-price). Stop returning a public `pdf_url` to the public client; return the id and serve via signed URL.
- Remove `pdf-react/` + the jsPDF fallback once parity is verified.
- `COTIZADOR_RENDER_URL` + `RENDER_SHARED_SECRET` set in Vercel (prod/preview).

---

## 3. Data flow

```
agent (dashboard) | buyer (microsite)  ──▶  /api/cotizaciones[...]
   └─▶ calcular.ts (corrected pricing: precio_negociado, cargos-in-total, phases==total)
       └─▶ buildCotizacionData(unidad, cotizador_config + selected plantilla, branding, agente, pricing)
           └─▶ buildCotizacionHtml(view)  ── self-contained premium HTML ──▶
               POST {COTIZADOR_RENDER_URL}/render  (x-render-token)
                 └─▶ Railway noddo-render: Chromium --print-to-pdf ──▶ PDF bytes
                     └─▶ upload to PRIVATE bucket `cotizaciones/{proyecto}/{id}.pdf`
                         └─▶ store object path in cotizaciones.pdf_url
                             ├─▶ email buyer (Resend, PDF attached)
                             └─▶ dashboard/microsite: signed URL on demand
```

---

## 4. Per-tenant customization

One NODDO-maintained premium template, fully parametrized by each project's `cotizador_config`:
- **Payment plan:** the selected `plantilla_pago` (filas, date rules, frequency, separación, delivery) → the payment-plan table + schedule.
- **Charges:** `cargos_adicionales` → itemized charges + included in the grand total.
- **Legal:** `notas_legales` → footer disclaimer.
- **Branding:** project logo + `--site-primary` color + project name; agent card from `agente_*`.
- **Currency:** base + optional secondary (dual display) via the existing exchange-rate path.
Developers configure options (existing `PlantillaEditor`); they never author layout. New config knobs (if the premium template needs them, e.g. cover image, accent toggles) are additive to `cotizador_config` and surfaced in the editor.

## 5. Error handling, security, testing

**Security (fixes P0-2 PII):** private `cotizaciones` bucket, signed URLs only, PDFs never in public `media`; worker behind a shared secret; service-role used only server-side.

**Error handling:** worker `/health` gate; render failures return structured errors; buyer/public path fails soft (quote saved, PDF retried) so a worker outage never blocks lead capture; agent path surfaces errors; idempotent re-render by `cotizacion_id`.

**Testing:** Vitest for `buildCotizacionData`/`buildCotizacionHtml` (golden HTML snapshots) and the pricing invariants (sum(phases)==grand total incl. cargos; precio_negociado honored). A worker contract test (`POST /render` of a known HTML → non-empty PDF). One e2e: generate a quote → assert the PDF/email total. The worker repo has its own smoke test.

## 6. Open items & out of scope

- **Premium PDF visual design** — the template's exact look (the "subir el nivel" goal) is iterated during implementation with mockups for owner review (offer the visual companion then). This spec fixes the data contract + sections; the styling is the creative layer on top.
- **Railway access for deploy** — building the worker + the app code needs no Railway access; only the final deploy does. Either an owner-provided Railway API token, or a `render-worker/go-live` script the owner runs (as with peptides `plan-render`). The classifier may block live infra changes from the agent regardless.
- **Out of scope:** Stripe/self-serve billing (deferred); the broader RLS/storage-authz/security remediation (separate plans — though the private-bucket migration here overlaps the storage-pii fix); rebuilding the pricing engine (reuse + fix only).

## 7. Decision gates (owner)

- **DG-1 Render engine:** Railway HTML→Chromium worker. ✅ Approved.
- **DG-2 Format level:** premium, data-driven (upgrade now, not faithful port). ✅ Approved.
- **DG-3 Worker shape:** generic reusable html→pdf (recommended) vs cotización-specific. → Recommend generic.
- **DG-4 Cargo semantics:** in Colombia construction has no IVA, so cargos usually empty; where configured, they ARE part of the grand total (confirm if a non-empty cargo appears for a tenant).
