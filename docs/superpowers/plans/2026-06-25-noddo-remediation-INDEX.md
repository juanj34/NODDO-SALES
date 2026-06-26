# NODDO Remediation — Master Plan (Milestone 1: one real customer live, safely)

**Goal:** Get NODDO to a state where one real constructora customer can be onboarded and run end-to-end — create a project → publish a microsite → capture a lead → issue a cotización with a financially-correct tax total → have an agent follow up — without cross-tenant data leakage, mispriced quotes, PII orphaning, or stale public microsites. This milestone fixes the 11 confirmed P0 blockers plus the P1/P2 items that gate a safe first launch. Billing self-serve is explicitly NOT required for M1 and runs on a parallel business track.

**Architecture:** Multi-tenant Next.js 16 SaaS for real-estate developers (Colombia/LatAm, Spanish). Premium project microsites at `/sites/[slug]/*` served from `proyecto_versiones` JSON snapshots; admin dashboard; 23-tab project editor; platform-admin console; "NodDo Quote"/cotizador. Tenant isolation is enforced at three layers that the audit found drifting out of sync: Supabase RLS policies, app-layer ownership checks (`auth.adminUserId`), and storage-path namespacing (R2 / Cloudflare Stream / Supabase storage).

**Tech Stack:** Next.js 16.1.6, React 19.2.3, TypeScript (strict), Tailwind 4. Supabase (Postgres 17, ~145 migrations, RLS broadly on), Cloudflare R2 (`noddo-tours` / `noddo-media`) + Stream, Google Gemini 2.5-flash, Resend, Mapbox, GoHighLevel + Meta CAPI + reCAPTCHA v3, Upstash, Sentry. Deployed on Vercel. Path aliases `@/components @/lib @/types @/hooks`; `.npmrc` has `legacy-peer-deps=true`. New test runner introduced this milestone: **Vitest** (single shared harness — see Cross-Cutting Notes).

> For agentic workers: use superpowers:subagent-driven-development or superpowers:executing-plans to execute each linked sub-plan task-by-task.

---

## 1. Scope

The 11 confirmed P0 blockers + key P1/P2 this milestone fixes, grouped by sub-plan:

**`2026-06-25-cotizador-correctness.md`** (pricing/quote integrity)
- **P0** — POST cotización ignores `precio_negociado`: saved/emailed quote uses list price while the client-built fixed phases use the negotiated price.
- **P0** — No invariant enforces that payment phases sum to the quoted total (silent under/over-collection).
- **P1** — `regenerate` silently re-prices an already-issued buyer from current base config (legal/trust risk).

**`2026-06-25-storage-pii.md`** (PII media leaks)
- **P0** — Project/media delete orphans PII-bearing media in Supabase + R2 storage.
- **P1** — `storage_media_bytes` quota counter not reclaimed on image delete.

**`2026-06-25-storage-authz.md`** (storage cross-tenant authz)
- **P0** — R2 media-presign and Cloudflare Stream-upload routes allow cross-tenant writes (IDOR).
- **P0** — Ownership checks rely on RLS, which leaks any *published* project; must tighten to `auth.adminUserId`.
- **P1/P2** — Global (non-project) upload folders are flat-shared across admin accounts.

**`2026-06-25-db-rls-isolation.md`** (database RLS)
- **P0** — RLS policies out of alignment with the app's 4-role + per-project permission model (cross-tenant read/write gaps on child tables).
- **P1** — Storage-quota helper plan-name numbers wrong; `colaborador_proyectos` per-project scoping not enforced in RLS.

**`2026-06-25-security-egress.md`** (egress/abuse hardening)
- **P0** — Operator-configurable webhooks have no SSRF egress guard (loopback/RFC1918/link-local/cloud-metadata reachable).
- **P1** — reCAPTCHA fails open in prod; GHL proxy has no distributed rate limit.

**`2026-06-25-plan-billing.md`** (plan gating + taxonomy)
- **P0** — Migration bug silently upgraded every project to Pro (gating bypass / revenue leak).
- **P1** — 4 conflicting plan/price/limit sources; public cotizador flag drifts out of sync with plan.

**`2026-06-25-infra-cache-cleanup.md`** (cache/infra)
- **P0** — On-demand revalidation gaps leave published microsites stale (publish-availability + restore-version).
- **P1/P2** — Dead Vercel function glob + missing `maxDuration`/font tracing on PDF routes; Next 16 `revalidateTag` semantics unpinned; untracked root debug junk.

**`2026-06-25-quality-tests-a11y.md`** (tests/CI/a11y)
- **P0 (process)** — No unit tests locking the cotizador financial engine; `npm test` not wired into CI.
- **P1** — 4 critical + 5 moderate WCAG 2.2 AA findings on marketing/microsite components.

---

## 2. PREREQUISITES (must happen before any task)

**(a) Green baseline.** Install deps and confirm a clean build before changing anything:
```
npm install            # .npmrc has legacy-peer-deps=true
npm run typecheck && npm run lint && npm run build
```
All three must pass. If the baseline is red, fix/triage that first — do not start tasks against a broken tree.

**(b) CRITICAL — confirm access to the REAL NODDO Supabase project.** The audit ran against the connected MCP, which points to **ReadyPep, NOT NODDO**. Several findings are DB-state-dependent and MUST be re-confirmed against the real NODDO Postgres before the DB/storage/billing tasks are trusted. Confirm, against the real NODDO project:
- **Uploads bucket public flag:** `select id, public from storage.buckets;` — verify the uploads bucket privacy matches the intended decision (see Decision Gates).
- **RLS posture:** RLS is enabled with ownership-scoped policies on **every** child table (not just parents). Spot-check role-impersonation reads/writes.
- **Env presence in Vercel prod:** whether `EXCHANGERATE_API_KEY`, `RECAPTCHA_SECRET_KEY`, and `UPSTASH_*` are set. These gate cotizador currency conversion (quality-tests-a11y / cotizador), fail-closed reCAPTCHA (security-egress), and distributed rate limiting (security-egress) respectively.
- **The "all projects Pro" corruption:** confirm how many rows are actually affected on the real DB before choosing KEEP vs RESET (plan-billing Task 3).

**(c) Working branch.** Create off `dev` — `fix/remediation-m1` (single track) or per-cluster `fix/<slug>` branches if parallelizing. **NEVER work on `main`.** Production (`noddo.io` = `main`) is owner-approval-only per WORKFLOW.md. For parallel cluster branches, isolate each in its own git worktree.

Verification gate before every commit (per WORKFLOW.md): `npm run typecheck && npm run lint` (and `npm test` once Vitest exists). RLS migrations apply via `npm run db:migrate` (`supabase db push`) — see the DB decision gate before applying to any shared DB.

---

## 3. DECISION GATES (owner-facing — resolve before the blocked tasks)

Consolidated from every sub-plan. Each gate names the sub-plan tasks it blocks. Recommended default in **bold**.

| # | Gate | Options | Blocks |
|---|------|---------|--------|
| G1 | **Test runner** | **Vitest** (shared harness) vs. fold into Playwright / `node:test`+`tsx`. Test bodies port verbatim either way. | cotizador Task 1; storage-pii harness; storage-authz tests; security-egress Task 0; infra-cache Vitest gate; quality-tests-a11y Task 0. **Resolve FIRST** — every cluster's tests depend on it. |
| G2 | **Canonical plan taxonomy + price table** | **A: keep code's `basico $199 / pro $249 / enterprise`, rewrite `PRICING.md`** vs. B: adopt PRICING.md's `esencial $79 / profesional $149` (rename slugs across DB + config + i18n + GHL tags). | plan-billing Tasks 2, 3, 6. |
| G3 | **Heal the "all projects Pro" rows** | **KEEP (non-destructive, fix-forward, leave existing Pro)** vs. RESET (owner supplies explicit project-id list to downgrade). Blanket downgrade FORBIDDEN (would strip paying customers). | plan-billing Task 3. |
| G4 | **Uploads bucket privacy** | Confirm intended public/private flag on the real NODDO bucket and align route behavior. | storage-authz; storage-pii; db-rls-isolation Task 5. Depends on Prereq (b). |
| G5 | **Billing model** | Sales-led (manual provisioning for M1 — **recommended for launch**) vs. Stripe self-serve (deferred to parallel business track, not an M1 gate). | plan-billing billing-model task (parallel track only — does not block launch). |
| G6 | **`cargos_adicionales` semantics** | Confirm whether additional charges are part of the quoted total that phases must sum to (affects the reconciliation invariant). | cotizador Task 2 (reconciliation guard) and downstream Tasks 3/4/5. |
| G7 | **WCAG-AA as a launch gate?** | Treat the 4 critical findings as M1-blocking vs. ship critical-only and defer moderates. | quality-tests-a11y a11y tasks (scoping only — does not block security/pricing tracks). |
| G8 | **i18n URL routing** | If taxonomy slugs change (G2 Option B) or plan names surface in URLs/i18n, confirm routing/locale strategy. | plan-billing Tasks 2/6 (only if G2=B). |
| G9 | **RLS production application** | Apply RLS migrations to preview/staging Supabase first, OR gate the shared-DB `db:migrate` on explicit owner approval. | **Every db-rls-isolation task's apply step.** |
| G10 | **mcp-server exposure** | Confirm whether the repo's MCP server surface is exposed in prod and should be locked down / removed for M1. | infra-cache-cleanup cleanup task (scoping). |
| G11 | regenerate semantics (cotizador) | **A: faithful reissue from `config_snapshot` + stored `resultado` (legal-safe)** vs. B: intentional re-price to current config (today's behavior). | cotizador Task 4. |
| G12 | storage-pii quota reclaim | **A: delete objects only** vs. B: also decrement `storage_media_bytes` (needs per-object size lookup). | storage-pii Task 3. |
| G13 | storage-pii bulk-delete wiring | **A: ship hardened helper only, wire call-site as owner-approved follow-up** vs. B: wire `deleteProjectMediaFiles` into project-delete route now. | storage-pii Task 4. |
| G14 | storage-authz global folders | **A: namespace per admin (`users/<adminUserId>/<folder>`)** vs. B: leave flat-shared + document residual risk. | storage-authz Task 1. |
| G15 | db RLS — administrador create | Allow `administrador` collaborators to CREATE projects (align RLS to API) vs. restrict to owner-only. | db-rls-isolation Task 2. |
| G16 | db RLS — quota helper scope | Fix plan-name numbers only vs. also re-enable RLS by moving upload route off service-role. | db-rls-isolation Task 5. |
| G17 | db RLS — `colaborador_proyectos` scoping | Enforce per-project scoping in RLS (proyectos-level now, child tables follow-up) vs. keep API-only. | db-rls-isolation Task 6. |
| G18 | infra revalidateTag profile | **A: keep `{expire:0}` (immediate blocking invalidation, read-your-own-writes)** vs. B: `"max"` (stale-while-revalidate). | infra-cache-cleanup Task 4. |
| G19 | a11y focus trap | **A: native plain-React tab focus trap (no dep)** vs. B: add `focus-trap-react`. | quality-tests-a11y Task 13. |

**Owner action:** Resolve G1, G2, G3, G4, G9 before execution starts — they block the most tasks. The remaining gates have safe recommended defaults and can be confirmed inline.

---

## 4. EXECUTION SEQUENCE (dependency-ordered Milestone-1 schedule)

All eight sub-plans declare `dependencies: []` (independently startable). The ordering below is driven by **risk, the shared Vitest harness, and decision-gate readiness** — not hard code dependencies. Tests are woven into each track; billing runs as a parallel business track.

### Step 0 — Foundations (Day 0, no owner decision needed)
1. **Prereqs (a)+(b)+(c)** — green baseline, real-NODDO-DB confirmation, working branch.
2. **Resolve G1** then stand up the **shared Vitest harness** (see Cross-Cutting Notes) — `2026-06-25-quality-tests-a11y.md` **Task 0** (~part of tests+CI ~4d). This is the single most-shared artifact; do it once, first.

### Step 1 — Trivial / no-decision infra fixes (Day 0–1)
- **`2026-06-25-infra-cache-cleanup.md`** — the no-decision items: publish-availability + restore-version revalidation gaps; dead Vercel function glob + `maxDuration` + serverless font tracing on PDF routes; pin Next 16 `revalidateTag` (G18 default A = no behavior change); untrack root debug junk. **8 tasks, ~3d total** (Task 4 awaits G18 = trivial default).

### Step 2 — Pricing correctness (Day 1–3) — highest customer-trust risk
- **`2026-06-25-cotizador-correctness.md`** — **6 tasks, 2.75–3.25d** (1.75–2d if Tasks 3/4/5 parallelized after Task 2). Order: Task 1 (Vitest scaffolding for cotizador — uses Step 0 harness) → **Task 2** reconciliation guard (needs **G6**) wired into all three routes → Tasks 3 (POST honors `precio_negociado`) / 4 (faithful-reissue regenerate, needs **G11**) / 5 (preview/issue parity) in parallel → Task 6.
- **`2026-06-25-quality-tests-a11y.md`** — the **financial-engine + currency-conversion unit tests** (locks cotizador math; reuses `2026-04-13-currency-conversion.md` context) land alongside cotizador. Confirm `EXCHANGERATE_API_KEY` from Prereq (b).

### Step 3 — Tenant-isolation & security (Day 3–7) — highest data-breach risk
Run these three together (they share `verifyProjectOwnership` / `resolveUploadTarget` — coordinate per Cross-Cutting Notes):
- **`2026-06-25-storage-authz.md`** — **6 tasks, ~3d.** Task 1 `resolveUploadTarget` primitive (needs **G14**, default A) → tighten R2 presign + Stream-upload ownership to `auth.adminUserId` → tests.
- **`2026-06-25-storage-pii.md`** — **6 tasks, 2.5d.** Cross-tenant write IDOR close (shares the authz primitive above — sequence after/with storage-authz Task 1) → delete-orphaning fixes (Task 3 needs **G12**; Task 4 needs **G13**, both default A) → Vitest TDD coverage.
- **`2026-06-25-security-egress.md`** — **7 tasks, 3–3.5d.** Task 0 SSRF-guard Vitest harness (G1) → DNS-resolving egress guard (loopback/RFC1918/link-local/metadata + redirect:error + save-time validation) → fail-closed reCAPTCHA in prod (confirm `RECAPTCHA_SECRET_KEY`) → Upstash rate-limit on GHL proxy (confirm `UPSTASH_*`).
- **`2026-06-25-db-rls-isolation.md`** — **7 tasks, 3.5–4.5d.** **GATED ON G9** (apply to staging first or owner-approve shared `db:migrate`). 6 additive/idempotent SQL migrations, each verified by SQL role-impersonation assertions BEFORE commit. Resolve G15/G16/G17 inline. Run in parallel with the app-layer storage work — but the storage-authz tightening to `auth.adminUserId` is what makes the app correct even where RLS lags, so do NOT treat RLS as a substitute for the app-layer checks.

### Step 4 — PII + plan wiring (Day 7–9)
- **PII delete orphaning** finalized here if not completed in Step 3 (storage-pii Tasks 3/4 call-site wiring per G13).
- **`2026-06-25-plan-billing.md`** — **7 tasks, 3–3.5d.** **GATED ON G2 (taxonomy) + G3 (heal strategy).** Collapse 4 plan/price/limit sources into `plan-config.ts` → fix the migration bug (Task 3, heal per G3 KEEP default) → derive the public cotizador flag from plan so gating stops drifting. Tasks 2/3/6 blocked on G2; if G2=Option B, also resolve G8 (i18n/slug routing).

### Step 5 — Accessibility + CI gate (Day 9–11, partially parallel)
- **`2026-06-25-quality-tests-a11y.md`** — remaining **14 tasks total, ~6d** (tests+CI ~4d already begun in Steps 0/2; a11y ~1.75d here). Wire `npm test` into the **GitHub Actions CI gate**. Remediate 4 critical + 5 moderate WCAG 2.2 AA findings (Task 13 focus trap per G19 default A). a11y scope/launch-gating per **G7**.

### Parallel business track (non-blocking for M1 launch)
- **Billing model (G5)** — sales-led manual provisioning for the first customer; Stripe self-serve deferred. Tracked in `2026-06-25-plan-billing.md` but NOT on the launch critical path.

**Critical path to launch:** Step 0 → Step 2 (pricing) → Step 3 (isolation/security) → Step 4 (plan wiring) → Step 5 CI gate. Infra (Step 1) and a11y (Step 5) run in slack time. Estimated ~11 working days single-threaded; compressible with parallel cluster worktrees once the shared harness (Step 0) and shared helpers exist.

---

## 5. CROSS-CUTTING NOTES (do these once, shared across sub-plans)

Multiple sub-plans touch the same artifacts. To avoid duplicate/conflicting work, treat each of these as a **single shared deliverable owned by the first cluster to reach it**:

- **Shared Vitest harness.** Introduced by `quality-tests-a11y` Task 0 (G1) and then consumed by cotizador, storage-pii, storage-authz, security-egress, and infra-cache. Build it ONCE in Step 0 — config (`vitest.config.ts`, `vite-tsconfig-paths` for `@/` aliases, `jsdom` env + `@testing-library/*` for component tests), devDependencies install, and the `npm test` script. Every other cluster imports from it; none re-creates a runner.
- **`verifyProjectOwnership` (app-layer ownership).** Both `storage-authz` and `storage-pii` (and implicitly the cotizador routes) must check ownership against **`auth.adminUserId`**, NOT rely on RLS (RLS leaks any *published* project). Define/locate ONE canonical helper; have all routes call it. storage-authz's `resolveUploadTarget` primitive should wrap this, not fork it.
- **`resolveUploadTarget` (authorization primitive).** Introduced by `storage-authz` Task 1. `storage-pii`'s cross-tenant write fixes must reuse it rather than re-deriving target/ownership logic. Sequence storage-authz Task 1 before storage-pii's IDOR fixes.
- **`revalidateProyecto` / on-demand revalidation.** `infra-cache-cleanup` owns the canonical microsite revalidation path (publish-availability, restore-version, `revalidateTag` semantics per G18). Any cluster that mutates a published project (plan-billing gating flips, cotizador public-flag derivation) must call THIS helper, not invent its own `revalidatePath`/`revalidateTag` call.
- **`plan-config.ts` single source of truth.** `plan-billing` collapses 4 plan/price/limit sources into one module; `db-rls-isolation` Task 5 (quota helper plan numbers) and the public-cotizador-flag derivation must read from `plan-config.ts`, not hardcode. Land `plan-config.ts` before the quota-helper number fix so they agree.
- **RLS vs app-layer.** db-rls-isolation hardens the DB floor; storage-authz/storage-pii harden the app ceiling. They are complementary, not redundant — neither replaces the other. Coordinate so both reference the same role/ownership model (4 roles + per-project `colaborador_proyectos`).

---

## 6. FINAL PRE-LAUNCH VERIFICATION CHECKLIST

Confirm ALL before onboarding the first real customer:

**Real-NODDO-DB confirmation (Prereq b, re-verified post-change):**
- [ ] `select id, public from storage.buckets;` on the **real NODDO** project — uploads bucket privacy matches the G4 decision.
- [ ] RLS enabled with ownership-scoped policies on **every** child table; role-impersonation assertions (db-rls-isolation) pass on the real/staging NODDO DB.
- [ ] `EXCHANGERATE_API_KEY`, `RECAPTCHA_SECRET_KEY`, `UPSTASH_*` confirmed present in Vercel **prod** (and reCAPTCHA confirmed fail-CLOSED in prod).
- [ ] The "all projects Pro" corruption resolved per G3 (KEEP/RESET) — verified by querying actual plan distribution on the real DB.

**Green CI build:**
- [ ] `npm install && npm run typecheck && npm run lint && npm run build` all green.
- [ ] `npm test` (Vitest) green — financial-engine + currency-conversion + SSRF-guard + storage authz/IDOR + reconciliation-invariant suites all passing.
- [ ] `npm test` wired into the GitHub Actions CI gate and passing on the branch.
- [ ] 4 critical WCAG 2.2 AA findings remediated (moderates per G7 decision).

**Manual end-to-end pass (single tenant, then a second tenant to prove isolation):**
- [ ] Create a project in the 23-tab editor → publish → microsite live at `/sites/[slug]/*` and shows current content (no stale snapshot; revalidation fired).
- [ ] Restore a prior version → microsite reflects the restored snapshot immediately.
- [ ] Submit a lead from the public microsite → reCAPTCHA enforced, rate limit active, lead reaches GHL.
- [ ] Build a cotización with a `precio_negociado` → saved/emailed quote uses the **negotiated** price; payment phases **sum to** the quoted total (reconciliation invariant holds incl. `cargos_adicionales` per G6); tax total correct; currency conversion correct.
- [ ] `regenerate` an issued quote → reproduces the originally-issued numbers (faithful reissue per G11), not a silent re-price.
- [ ] Agent follow-up flow works end-to-end (lead → assignment → contact).
- [ ] **Isolation proof:** as tenant B, attempt to read/write tenant A's project, presign/upload to tenant A's storage paths, and read tenant A's quotes/leads → all DENIED at both app layer (`auth.adminUserId`) and DB layer (RLS).
- [ ] Delete a project / media → no PII-bearing objects orphaned in Supabase or R2; quota counter behaves per G12.
- [ ] Plan gating: a `basico` project cannot access Pro-gated features; the public cotizador flag is derived from plan and in sync.

**Governance:**
- [ ] All work merged to `dev` (or `fix/<slug>` → `dev`), NEVER pushed to `main` without explicit owner approval. Conventional commit prefixes used. RLS migrations applied per G9 (staging-first or owner-approved).

---

### Linked sub-plans
- `2026-06-25-cotizador-correctness.md` — 6 tasks, 2.75–3.25d
- `2026-06-25-storage-pii.md` — 6 tasks, 2.5d
- `2026-06-25-storage-authz.md` — 6 tasks, ~3d
- `2026-06-25-db-rls-isolation.md` — 7 tasks, 3.5–4.5d
- `2026-06-25-security-egress.md` — 7 tasks, 3–3.5d
- `2026-06-25-plan-billing.md` — 7 tasks, 3–3.5d
- `2026-06-25-infra-cache-cleanup.md` — 8 tasks, ~3d
- `2026-06-25-quality-tests-a11y.md` — 14 tasks, ~6d
- Reference context: `2026-04-13-currency-conversion.md`
