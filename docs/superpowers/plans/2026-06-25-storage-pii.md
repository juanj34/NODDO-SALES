# Storage PII Exposure + Media-Delete Leaks Remediation Plan

**Goal:** Close the cross-tenant storage write/IDOR holes in the presign + stream-upload routes and stop orphaning (PII-bearing) media in R2 / Supabase Storage when DB records are deleted.

**Architecture:** Three independent route-level fixes plus a one-time test-harness bootstrap. Every storage-mutating route already runs through `getAuthContext()` + `requirePermission()`; the gaps are (a) the R2 media-presign route trusts a client-supplied `folder` with no project-ownership check, letting any authenticated tenant presign a write into another tenant's `proyectos/<uuid>/…` key space; (b) the Cloudflare Stream direct-upload route verifies the project exists but not that it belongs to the caller's admin account; (c) DELETE handlers for galería images and R2 media records remove the DB row but never delete the backing object, so the optimized image, its thumbnail and any PDF stay publicly reachable forever and storage quota is never reclaimed (`deleteMediaFile` in `src/lib/r2.ts` is dead code, never imported). We harden the two write paths with an ownership gate (reusing the existing `verifyProjectOwnership` helper and the `proyectos/<uuid>` folder convention every caller already uses) and wire real storage deletion into the delete paths.

**Tech Stack:** Next.js 16 App Router route handlers (`NextRequest`/`NextResponse`), Supabase JS (`@supabase/supabase-js`, admin/service-role + RLS server client), AWS SDK v3 S3 client against Cloudflare R2 (`@aws-sdk/client-s3`), Cloudflare Stream REST. New dev-only: Vitest 3 + `@vitejs/plugin-react` (none exists today — `package.json` ships only Playwright).

---

## Branch & governance

- All work on a fix branch off `dev`: `git checkout dev && git pull && git checkout -b fix/storage-pii`.
- Conventional commits (`feat:`/`fix:`/`chore:`/`test:`). NEVER push or merge to `main` (production `noddo.io`) — that needs explicit owner approval per `WORKFLOW.md`.
- Verify gate before **every** commit: `npm run typecheck && npm run lint` (and `npm test` once Task 0 lands vitest). Expected: typecheck exits 0 with no output; lint exits 0 (warnings tolerated, no errors).

---

## Task 0 — Bootstrap a unit-test harness (Vitest)

The TDD tasks below need a runnable `npm test`. The repo has only Playwright e2e today (`tests/e2e/`, `playwright.config.ts`) and no `vitest` in `package.json`. This task adds Vitest scoped to `tests/unit/**` so it never collides with Playwright's `tests/e2e/**`.

**Files**
- Modify: `C:/dev/NODDO-SALES/package.json` (add devDeps + `test` script)
- Create: `C:/dev/NODDO-SALES/vitest.config.ts`
- Create: `C:/dev/NODDO-SALES/tests/unit/.gitkeep`

**Steps**
- [ ] Install dev dependencies (legacy-peer-deps is already in `.npmrc`):
  ```bash
  npm i -D vitest@^3 @vitejs/plugin-react@^4 vite-tsconfig-paths@^5
  ```
  Expected: installs cleanly, `package.json` devDependencies now list `vitest`, `@vitejs/plugin-react`, `vite-tsconfig-paths`.
- [ ] Add the `test` script to `package.json` `scripts` (keep existing scripts):
  ```json
  "test": "vitest run",
  "test:watch": "vitest"
  ```
- [ ] Create `vitest.config.ts` (scoped to unit dir, `@/` alias via tsconfig paths, node env since we test route handlers):
  ```ts
  import { defineConfig } from "vitest/config";
  import tsconfigPaths from "vite-tsconfig-paths";

  export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      environment: "node",
      include: ["tests/unit/**/*.test.ts"],
      globals: true,
    },
  });
  ```
- [ ] Create `tests/unit/.gitkeep` (empty file) so the directory is tracked.
- [ ] Verify the harness runs with zero tests:
  ```bash
  npm test
  ```
  Expected: Vitest reports `No test files found, exiting with code 0` (or `0 passed`) and exits 0.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint
  ```
  Expected: both exit 0.
- [ ] Commit:
  ```bash
  git add package.json package-lock.json vitest.config.ts tests/unit/.gitkeep
  git commit -m "chore: add vitest unit-test harness scoped to tests/unit"
  ```

---

## Task 1 — Fix cross-tenant write IDOR in `/api/media/presign` (P0)

**Problem (verified):** `src/app/api/media/presign/route.ts` reads `folder` from the request body and passes it straight to `getPresignedMediaUploadUrl(auth.user.id, folder, …)`. Inside `src/lib/r2.ts:130-150`, the `projectId` argument is **never used** — the R2 key is literally `${folder}/${fileName}`. There is no check that `folder` belongs to the caller. Every legit caller passes `folder = \`proyectos/${projectId}/…\`` (e.g. `src/components/dashboard/cotizador/CotizadorPdfSettings.tsx:156`, `editor/[id]/page.tsx:302`). So any authenticated user (incl. an `asesor` — `upload.files` min-role is `asesor`) can POST `{ folder: "proyectos/<VICTIM_UUID>/cotizador", ... }` and receive a 15-min presigned PUT URL that writes into another constructora's media namespace (overwriting their cotizador PDFs / OG images, planting content). This is a tenant-isolation break.

**Fix:** Require `folder` to start with `proyectos/<uuid>` (or the `avatars/` allowlist), extract that `<uuid>`, and verify the caller owns the project via the existing `verifyProjectOwnership(auth, projectId)` helper (`src/lib/auth-context.ts:173`, which checks `proyectos.user_id === auth.adminUserId`). Reject anything else with 403.

**Files**
- Modify: `C:/dev/NODDO-SALES/src/app/api/media/presign/route.ts` (add import + ownership gate before `getPresignedMediaUploadUrl`, line ~49-57)
- Test: `C:/dev/NODDO-SALES/tests/unit/media-presign-ownership.test.ts` (Create)

### Steps

- [ ] Write the failing test. Create `tests/unit/media-presign-ownership.test.ts`. It mocks `@/lib/auth-context` and `@/lib/r2`, then asserts the route extracts + validates the project and rejects folders the caller does not own.
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  const verifyProjectOwnership = vi.fn();
  const getPresignedMediaUploadUrl = vi.fn();

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(async () => ({
      user: { id: "caller-user", email: "a@b.com" },
      role: "admin",
      adminUserId: "caller-user",
      supabase: {},
    })),
    requirePermission: vi.fn(() => null),
    verifyProjectOwnership: (...args: unknown[]) => verifyProjectOwnership(...args),
  }));

  vi.mock("@/lib/r2", () => ({
    getPresignedMediaUploadUrl: (...args: unknown[]) => getPresignedMediaUploadUrl(...args),
    ensureMediaBucketCors: vi.fn(async () => {}),
  }));

  vi.mock("@/lib/error-reporter", () => ({ reportApiError: vi.fn(async () => {}) }));

  function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/media/presign", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  const VALID_FOLDER = "proyectos/11111111-1111-1111-1111-111111111111/cotizador";
  const OTHER_FOLDER = "proyectos/99999999-9999-9999-9999-999999999999/cotizador";
  const baseBody = { fileName: "doc.pdf", contentType: "application/pdf", size: 1234 };

  describe("POST /api/media/presign ownership", () => {
    beforeEach(() => {
      verifyProjectOwnership.mockReset();
      getPresignedMediaUploadUrl.mockReset();
      getPresignedMediaUploadUrl.mockResolvedValue({ uploadUrl: "u", publicUrl: "p", key: "k" });
    });

    it("403s when the caller does not own the project in folder", async () => {
      verifyProjectOwnership.mockResolvedValue(false);
      const { POST } = await import("@/app/api/media/presign/route");
      const res = await POST(makeReq({ ...baseBody, folder: OTHER_FOLDER }));
      expect(res.status).toBe(403);
      expect(getPresignedMediaUploadUrl).not.toHaveBeenCalled();
      expect(verifyProjectOwnership).toHaveBeenCalledWith(
        expect.anything(),
        "99999999-9999-9999-9999-999999999999",
      );
    });

    it("400s when folder is not a proyectos/<uuid> or avatars/ path", async () => {
      const { POST } = await import("@/app/api/media/presign/route");
      const res = await POST(makeReq({ ...baseBody, folder: "etc/passwd" }));
      expect(res.status).toBe(400);
      expect(getPresignedMediaUploadUrl).not.toHaveBeenCalled();
    });

    it("presigns when the caller owns the project", async () => {
      verifyProjectOwnership.mockResolvedValue(true);
      const { POST } = await import("@/app/api/media/presign/route");
      const res = await POST(makeReq({ ...baseBody, folder: VALID_FOLDER }));
      expect(res.status).toBe(200);
      expect(getPresignedMediaUploadUrl).toHaveBeenCalledTimes(1);
    });

    it("allows the avatars/ folder without a project check", async () => {
      const { POST } = await import("@/app/api/media/presign/route");
      const res = await POST(makeReq({ ...baseBody, folder: "avatars" }));
      expect(res.status).toBe(200);
      expect(verifyProjectOwnership).not.toHaveBeenCalled();
    });
  });
  ```
- [ ] Run the test — expect FAIL:
  ```bash
  npx vitest run tests/unit/media-presign-ownership.test.ts
  ```
  Expected: FAIL — the "403 when caller does not own" and "400 when folder not proyectos/avatars" cases fail because the current route accepts any folder (`verifyProjectOwnership` is never called; route returns 200).
- [ ] Implement the gate. In `src/app/api/media/presign/route.ts`, change the import on line 1 to add `verifyProjectOwnership`:
  ```ts
  import { getAuthContext, requirePermission, verifyProjectOwnership, type AuthContext } from "@/lib/auth-context";
  ```
  Then, after the existing path-traversal check (current lines 35-40) and before the `size > MAX_FILE_SIZE` check (current line 42), insert the folder-ownership gate:
  ```ts
    // Folder must be scoped to a project the caller owns, or the avatars space.
    const PROJECT_FOLDER_RE = /^proyectos\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(\/|$)/i;
    const isAvatarFolder = folder === "avatars" || folder.startsWith("avatars/");
    const projectMatch = folder.match(PROJECT_FOLDER_RE);

    if (!projectMatch && !isAvatarFolder) {
      return NextResponse.json(
        { error: "Carpeta inválida" },
        { status: 400 }
      );
    }

    if (projectMatch) {
      const owns = await verifyProjectOwnership(auth, projectMatch[1]);
      if (!owns) {
        return NextResponse.json(
          { error: "Sin acceso a este proyecto" },
          { status: 403 }
        );
      }
    }
  ```
  (Leave the `getPresignedMediaUploadUrl(auth.user.id, folder, …)` call as-is; the key is unchanged for legit callers so existing uploads keep working.)
- [ ] Run the test — expect PASS:
  ```bash
  npx vitest run tests/unit/media-presign-ownership.test.ts
  ```
  Expected: 4 passed.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0.
- [ ] Commit:
  ```bash
  git add src/app/api/media/presign/route.ts tests/unit/media-presign-ownership.test.ts
  git commit -m "fix: enforce project ownership on media presign to block cross-tenant writes"
  ```

---

## Task 2 — Add tenant scope to `/api/videos/stream/upload` ownership check (P0)

**Problem (verified):** `src/app/api/videos/stream/upload/route.ts:23-35` "verifies project ownership" with `auth.supabase.from("proyectos").select("id").eq("id", proyecto_id).single()` — there is **no** `.eq("user_id", auth.adminUserId)`. The query runs through the RLS server client, and the `proyectos` SELECT policy includes `Public read published projects` (`USING (estado = 'publicado')`, `init.sql:92-94`). So for any **published** project of another tenant, the SELECT succeeds, the route calls `createDirectUpload(proyecto_id)` on Cloudflare Stream and **inserts a `videos` row pointed at the victim's `proyecto_id`** (the INSERT itself is then blocked by the videos RLS owner policy, but a Stream direct-upload URL + metadata leak still occurs, and the contrast with the correctly-scoped sibling routes `tours/presign` and `tours/[proyecto_id]` confirms this is the intended invariant). Compare `src/app/api/tours/presign/route.ts:33-45` and `src/app/api/tours/[proyecto_id]/route.ts:20-32`, which both scope with `.eq("user_id", auth.adminUserId)`.

**Fix:** Reuse the same ownership pattern via the shared `verifyProjectOwnership` helper so the check is identical across routes.

**Files**
- Modify: `C:/dev/NODDO-SALES/src/app/api/videos/stream/upload/route.ts` (line 1 import + replace the ownership query at lines 23-35)
- Test: `C:/dev/NODDO-SALES/tests/unit/videos-stream-upload-ownership.test.ts` (Create)

### Steps

- [ ] Write the failing test. Create `tests/unit/videos-stream-upload-ownership.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  const verifyProjectOwnership = vi.fn();
  const createDirectUpload = vi.fn();

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(async () => ({
      user: { id: "caller", email: "a@b.com" },
      role: "admin",
      adminUserId: "caller",
      supabase: {},
    })),
    requirePermission: vi.fn(() => null),
    verifyProjectOwnership: (...args: unknown[]) => verifyProjectOwnership(...args),
  }));

  vi.mock("@/lib/cloudflare-stream", () => ({
    createDirectUpload: (...args: unknown[]) => createDirectUpload(...args),
  }));

  function makeReq(body: unknown) {
    return new NextRequest("http://localhost/api/videos/stream/upload", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" },
    });
  }

  describe("POST /api/videos/stream/upload ownership", () => {
    beforeEach(() => {
      verifyProjectOwnership.mockReset();
      createDirectUpload.mockReset();
      createDirectUpload.mockResolvedValue({ uid: "uid1", uploadURL: "https://up" });
    });

    it("404s and never hits Cloudflare when caller does not own the project", async () => {
      verifyProjectOwnership.mockResolvedValue(false);
      const { POST } = await import("@/app/api/videos/stream/upload/route");
      const res = await POST(makeReq({ proyecto_id: "victim-uuid", filename: "v.mp4" }));
      expect(res.status).toBe(404);
      expect(createDirectUpload).not.toHaveBeenCalled();
      expect(verifyProjectOwnership).toHaveBeenCalledWith(expect.anything(), "victim-uuid");
    });
  });
  ```
  (We assert only the ownership-rejection branch — the happy path needs the Supabase query builder for `videos` insert which is out of scope for this unit; the 404 branch fully covers the security gap.)
- [ ] Run the test — expect FAIL:
  ```bash
  npx vitest run tests/unit/videos-stream-upload-ownership.test.ts
  ```
  Expected: FAIL — current route never calls `verifyProjectOwnership` and would proceed to the Supabase query (throwing on the mocked empty `supabase` object) rather than returning a clean 404.
- [ ] Implement. In `src/app/api/videos/stream/upload/route.ts`, change line 1 to:
  ```ts
  import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
  ```
  Replace the current ownership block (lines 23-35):
  ```ts
      // Verify project ownership
      const { data: project } = await auth.supabase
        .from("proyectos")
        .select("id")
        .eq("id", proyecto_id)
        .single();

      if (!project) {
        return NextResponse.json(
          { error: "Proyecto no encontrado" },
          { status: 404 }
        );
      }
  ```
  with:
  ```ts
      // Verify project ownership (scoped to the caller's admin account, not just existence)
      const owns = await verifyProjectOwnership(auth, proyecto_id);
      if (!owns) {
        return NextResponse.json(
          { error: "Proyecto no encontrado" },
          { status: 404 }
        );
      }
  ```
- [ ] Run the test — expect PASS:
  ```bash
  npx vitest run tests/unit/videos-stream-upload-ownership.test.ts
  ```
  Expected: 1 passed.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0.
- [ ] Commit:
  ```bash
  git add src/app/api/videos/stream/upload/route.ts tests/unit/videos-stream-upload-ownership.test.ts
  git commit -m "fix: scope stream-upload ownership check to caller's admin account"
  ```

---

## Task 3 — Stop orphaning storage on galería-image delete (P1)

**Problem (verified):** `src/app/api/galeria/imagenes/[id]/route.ts` DELETE removes the `galeria_imagenes` row (lines 62-67) but never deletes the backing storage objects. Galería images are uploaded through `/api/upload` (`src/components/dashboard/UploadModal.tsx:117-124` posts to `/api/upload` with `bucket=media`), which writes an **optimized WebP** and a **thumbnail WebP** to the Supabase `media` bucket (`src/app/api/upload/route.ts:135-168`) and returns `url` + `thumbnail_url`. After the row is deleted, both objects remain publicly readable (the `media` bucket is `public`, `init.sql:145`) and the project's `storage_media_bytes` quota is never reclaimed. `deleteMediaFile` in `src/lib/r2.ts:155` is dead code (no importer anywhere in `src/`). Result: deleted project imagery (which can include floor plans, renders and people in marketing shots) stays exposed at a guessable Supabase public URL indefinitely.

**Fix:** In the galería-image DELETE handler, read the row's `url` + `thumbnail_url` **before** deleting, map each Supabase public URL back to its object path, and remove both from the `media` bucket via the service-role client (mirrors the existing `deleteFile` convention in `src/lib/supabase/queries.ts:413-419`). Storage cleanup is best-effort (must not block the DB delete). This reuses the existing `createAdminClient()` (`src/lib/supabase/admin.ts`).

> DECISION GATE: Reclaim `storage_media_bytes` on delete?
> Deleting the objects fixes the PII exposure regardless. Whether to also decrement the project's `storage_media_bytes` quota counter is an owner call, because today nothing decrements it and the upload path only ever increments (`src/app/api/upload/route.ts:181`, RPC `increment_storage_media_bytes` accepts a signed `BIGINT`, so a negative value already decrements — no migration needed).
> - **Branch A (default, recommended): delete objects only.** Implement the storage removal below; do NOT touch the counter. Lowest risk; quota stays slightly overcounted (already the status quo).
> - **Branch B: also decrement the counter.** Additionally HEAD each removed object first (or trust nothing — we don't store per-image byte size on `galeria_imagenes`, confirmed by the schema: it has only `categoria_id, url, thumbnail_url, alt_text, orden`). Because per-object size isn't persisted, Branch B requires either a `headObject`/`storage.from(...).list` size lookup per file or a schema change to persist bytes. Given that cost, default to Branch A and revisit counter accuracy as a separate task. The steps below implement Branch A.

**Files**
- Modify: `C:/dev/NODDO-SALES/src/app/api/galeria/imagenes/[id]/route.ts` (DELETE handler, lines 43-89)
- Test: `C:/dev/NODDO-SALES/tests/unit/galeria-image-delete-storage.test.ts` (Create)

### Steps

- [ ] Write the failing test. Create `tests/unit/galeria-image-delete-storage.test.ts`. It mocks the admin client's storage and asserts the DELETE removes both the optimized and thumbnail object paths derived from the stored public URLs.
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";
  import { NextRequest } from "next/server";

  const removeMock = vi.fn(async () => ({ error: null }));

  // Supabase RLS client used by the route for the DB read/delete + activity log lookups.
  function makeAuthSupabase(row: { url: string; thumbnail_url: string | null; categoria_id: string }) {
    return {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(async () => ({ data: row })),
            maybeSingle: vi.fn(async () => ({ data: null })),
          })),
        })),
        delete: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
      })),
    };
  }

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(async () => ({
      user: { id: "caller", email: "a@b.com" },
      role: "admin",
      adminUserId: "caller",
      supabase: makeAuthSupabase({
        url: "https://proj.supabase.co/storage/v1/object/public/media/proyectos/p1/galeria/abc.webp",
        thumbnail_url: "https://proj.supabase.co/storage/v1/object/public/media/proyectos/p1/galeria/thumbs/abc.webp",
        categoria_id: "cat1",
      }),
    })),
    requirePermission: vi.fn(() => null),
  }));

  vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: vi.fn(() => ({
      storage: { from: vi.fn(() => ({ remove: removeMock })) },
    })),
  }));

  vi.mock("@/lib/activity-logger", () => ({ logActivity: vi.fn() }));

  function makeReq() {
    return new NextRequest("http://localhost/api/galeria/imagenes/img1", { method: "DELETE" });
  }

  describe("DELETE /api/galeria/imagenes/[id] storage cleanup", () => {
    beforeEach(() => removeMock.mockClear());

    it("removes the optimized + thumbnail objects from the media bucket", async () => {
      const { DELETE } = await import("@/app/api/galeria/imagenes/[id]/route");
      const res = await DELETE(makeReq(), { params: Promise.resolve({ id: "img1" }) });
      expect(res.status).toBe(200);
      expect(removeMock).toHaveBeenCalledTimes(1);
      const removedPaths = removeMock.mock.calls[0][0] as string[];
      expect(removedPaths).toContain("proyectos/p1/galeria/abc.webp");
      expect(removedPaths).toContain("proyectos/p1/galeria/thumbs/abc.webp");
    });
  });
  ```
- [ ] Run the test — expect FAIL:
  ```bash
  npx vitest run tests/unit/galeria-image-delete-storage.test.ts
  ```
  Expected: FAIL — current handler never imports `createAdminClient` / calls `storage.remove`, so `removeMock` is called 0 times.
- [ ] Implement. In `src/app/api/galeria/imagenes/[id]/route.ts`:
  1. Add imports at the top (after line 3):
  ```ts
  import { createAdminClient } from "@/lib/supabase/admin";
  ```
  2. Add a module-scope helper above the `PUT` export (after the imports) that maps a Supabase public URL to a `{ bucket, path }` pair:
  ```ts
  /** Map a Supabase Storage public URL to its bucket + object path, or null. */
  function parseStoragePublicUrl(url: string | null | undefined): { bucket: string; path: string } | null {
    if (!url) return null;
    const marker = "/storage/v1/object/public/";
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const rest = url.slice(idx + marker.length).split("?")[0];
    const slash = rest.indexOf("/");
    if (slash === -1) return null;
    return { bucket: rest.slice(0, slash), path: decodeURIComponent(rest.slice(slash + 1)) };
  }
  ```
  3. In the DELETE handler, change the pre-delete fetch (current lines 56-60) to also select `url, thumbnail_url`:
  ```ts
      // Fetch image info before deleting (for storage cleanup + the activity log)
      const { data: img } = await auth.supabase
        .from("galeria_imagenes")
        .select("categoria_id, url, thumbnail_url")
        .eq("id", id)
        .single();
  ```
  4. After the row is successfully deleted (after the `if (error) throw error;` at current line 67), add best-effort storage cleanup:
  ```ts
      // Best-effort: delete the backing storage objects so they don't leak after the row is gone.
      if (img) {
        try {
          const admin = createAdminClient();
          const byBucket = new Map<string, string[]>();
          for (const u of [img.url, img.thumbnail_url]) {
            const parsed = parseStoragePublicUrl(u);
            if (!parsed) continue;
            const list = byBucket.get(parsed.bucket) ?? [];
            list.push(parsed.path);
            byBucket.set(parsed.bucket, list);
          }
          for (const [bucket, paths] of byBucket) {
            await admin.storage.from(bucket).remove(paths);
          }
        } catch (cleanupErr) {
          console.error("[galeria/imagenes/delete] storage cleanup failed:", cleanupErr);
        }
      }
  ```
  5. Keep the existing activity-log block (current lines 69-80) but note `img` no longer carries only `categoria_id` — it still has `categoria_id`, so `img.categoria_id` keeps working unchanged.
- [ ] Run the test — expect PASS:
  ```bash
  npx vitest run tests/unit/galeria-image-delete-storage.test.ts
  ```
  Expected: 1 passed.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0.
- [ ] Commit:
  ```bash
  git add src/app/api/galeria/imagenes/[id]/route.ts tests/unit/galeria-image-delete-storage.test.ts
  git commit -m "fix: delete galeria image storage objects on row delete to stop media leak"
  ```

---

## Task 4 — Wire `deleteMediaFile` into R2-media deletion + add a path guard (P1)

**Problem (verified):** `deleteMediaFile(key)` in `src/lib/r2.ts:155-163` deletes from the R2 `noddo-media` bucket but is **never imported anywhere** (dead code). R2 media (PDFs/large docs uploaded via `/api/media/presign` → `proyectos/<uuid>/cotizador/…`) is therefore never cleaned up. Separately, because it takes a raw `key`, any future caller could be tricked into deleting an arbitrary key. Right now there is no route that deletes individual R2 media, so the concrete leak is: when a project is deleted (`/api/proyectos/[id]` DELETE / `auth/delete-account`) the DB cascades but R2 media under `proyectos/<uuid>/` is orphaned. We make `deleteMediaFile` usable and safe by (a) accepting only keys under a verified project prefix, and (b) adding a `deleteProjectMediaFiles(projectId)` bulk helper (prefix-scoped, mirroring `deleteTourFiles`) so the project-delete path can reclaim R2 media.

> DECISION GATE: Wire bulk R2-media cleanup into the project-delete path now, or ship the helper only?
> The helper + guard are pure additions (no behavior change) and safe to land immediately. Calling it from `/api/proyectos/[id]` DELETE changes deletion behavior and touches a hot path.
> - **Branch A (default, recommended): ship `deleteProjectMediaFiles` + harden `deleteMediaFile`, do NOT call from the project-delete route yet.** Lets QA verify the helper in isolation; the call-site wiring becomes a tiny follow-up the owner can approve. Steps below implement Branch A.
> - **Branch B: also call it from the project-delete route.** After Branch A lands, add `await deleteProjectMediaFiles(id).catch(() => {})` immediately after the R2 tour cleanup in `src/app/api/proyectos/[id]/route.ts` (locate the existing `deleteTourFiles(id)` call there and place the new call directly after it, same best-effort try/catch style). Confirm the exact line with `grep -n "deleteTourFiles" src/app/api/proyectos/[id]/route.ts` before editing.

**Files**
- Modify: `C:/dev/NODDO-SALES/src/lib/r2.ts` (harden `deleteMediaFile`, add `deleteProjectMediaFiles`)
- Test: `C:/dev/NODDO-SALES/tests/unit/r2-delete-media.test.ts` (Create)

### Steps

- [ ] Write the failing test. Create `tests/unit/r2-delete-media.test.ts`. It mocks the S3 client `send` and asserts: (a) `deleteMediaFile` rejects keys not under `proyectos/<uuid>/`, (b) `deleteProjectMediaFiles` lists + deletes by prefix and returns the count.
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  const sendMock = vi.fn();

  vi.mock("@aws-sdk/client-s3", () => {
    class FakeCmd { constructor(public input: unknown) {} }
    return {
      S3Client: vi.fn(() => ({ send: sendMock })),
      PutObjectCommand: FakeCmd,
      ListObjectsV2Command: class { constructor(public input: unknown) {} },
      DeleteObjectsCommand: class { constructor(public input: unknown) {} },
      PutBucketCorsCommand: FakeCmd,
      GetBucketCorsCommand: FakeCmd,
    };
  });
  vi.mock("@aws-sdk/s3-request-presigner", () => ({ getSignedUrl: vi.fn(async () => "https://signed") }));

  describe("r2 media deletion", () => {
    beforeEach(() => sendMock.mockReset());

    it("deleteMediaFile rejects keys outside proyectos/<uuid>/", async () => {
      const { deleteMediaFile } = await import("@/lib/r2");
      await expect(deleteMediaFile("etc/secret.pdf")).rejects.toThrow();
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("deleteMediaFile deletes a key under a project prefix", async () => {
      sendMock.mockResolvedValue({});
      const { deleteMediaFile } = await import("@/lib/r2");
      await deleteMediaFile("proyectos/11111111-1111-1111-1111-111111111111/cotizador/a.pdf");
      expect(sendMock).toHaveBeenCalledTimes(1);
    });

    it("deleteProjectMediaFiles lists then deletes by prefix and returns count", async () => {
      sendMock
        .mockResolvedValueOnce({ Contents: [{ Key: "k1" }, { Key: "k2" }], IsTruncated: false })
        .mockResolvedValueOnce({});
      const { deleteProjectMediaFiles } = await import("@/lib/r2");
      const n = await deleteProjectMediaFiles("11111111-1111-1111-1111-111111111111");
      expect(n).toBe(2);
      expect(sendMock).toHaveBeenCalledTimes(2);
    });
  });
  ```
- [ ] Run the test — expect FAIL:
  ```bash
  npx vitest run tests/unit/r2-delete-media.test.ts
  ```
  Expected: FAIL — `deleteMediaFile` currently does not validate the key (first case fails), and `deleteProjectMediaFiles` does not exist (import is `undefined`, third case throws).
- [ ] Implement. In `src/lib/r2.ts`, replace the existing `deleteMediaFile` (lines 152-163) with a guarded version, and add `deleteProjectMediaFiles` right after it. Add a shared guard regex near the top of the media section:
  ```ts
  const PROJECT_MEDIA_KEY_RE = /^proyectos\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//i;

  /**
   * Delete a single media file from R2. Only keys scoped to a project
   * (proyectos/<uuid>/...) are accepted, to prevent arbitrary-key deletion.
   */
  export async function deleteMediaFile(key: string): Promise<void> {
    if (!PROJECT_MEDIA_KEY_RE.test(key)) {
      throw new Error(`deleteMediaFile: refusing to delete unscoped key "${key}"`);
    }
    const client = getR2Client();
    await client.send(
      new DeleteObjectsCommand({
        Bucket: R2_MEDIA_BUCKET,
        Delete: { Objects: [{ Key: key }], Quiet: true },
      })
    );
  }

  /**
   * Delete all R2 media files for a project (prefix proyectos/<projectId>/).
   * Returns the number of objects deleted. Mirrors deleteTourFiles.
   */
  export async function deleteProjectMediaFiles(projectId: string): Promise<number> {
    const client = getR2Client();
    const prefix = `proyectos/${projectId}/`;
    let deleted = 0;
    let continuationToken: string | undefined;

    do {
      const list = await client.send(
        new ListObjectsV2Command({
          Bucket: R2_MEDIA_BUCKET,
          Prefix: prefix,
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        })
      );

      const objects = list.Contents;
      if (!objects || objects.length === 0) break;

      await client.send(
        new DeleteObjectsCommand({
          Bucket: R2_MEDIA_BUCKET,
          Delete: { Objects: objects.map((o) => ({ Key: o.Key! })), Quiet: true },
        })
      );

      deleted += objects.length;
      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    return deleted;
  }
  ```
  (`ListObjectsV2Command` and `DeleteObjectsCommand` are already imported at the top of `r2.ts` lines 1-8 — no new imports needed.)
- [ ] Run the test — expect PASS:
  ```bash
  npx vitest run tests/unit/r2-delete-media.test.ts
  ```
  Expected: 3 passed.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0. (Note: hardening `deleteMediaFile`'s signature is backward-compatible — it still takes a single `key: string`.)
- [ ] Commit (Branch A):
  ```bash
  git add src/lib/r2.ts tests/unit/r2-delete-media.test.ts
  git commit -m "fix: harden deleteMediaFile key scope and add prefix-scoped R2 media cleanup"
  ```
- [ ] (Branch B only, after owner approval) Wire the call into project delete, re-run the full verify gate, and commit:
  ```bash
  git add src/app/api/proyectos/[id]/route.ts
  git commit -m "fix: reclaim orphaned R2 media when a project is deleted"
  ```

---

## Task 5 — Manual cross-tenant verification on the dev preview (no code)

Confirm the two write-path fixes hold against the live RLS + R2 stack before any merge to `main` is proposed.

**Files**
- None (manual verification only). Run after Tasks 1-2 are pushed to `dev` and a Vercel preview is built.

**Steps**
- [ ] Push the branch and open a PR into `dev` (not `main`):
  ```bash
  git push origin fix/storage-pii
  ```
  Expected: a Vercel preview deploy is created for the branch.
- [ ] As a logged-in tenant A (asesor or admin), capture A's session cookie, then call media presign with **tenant B's** project UUID:
  ```bash
  curl -i -X POST "<PREVIEW_URL>/api/media/presign" \
    -H "content-type: application/json" \
    -H "cookie: <TENANT_A_SESSION_COOKIES>" \
    -d '{"folder":"proyectos/<TENANT_B_PROJECT_UUID>/cotizador","fileName":"x.pdf","contentType":"application/pdf","size":100}'
  ```
  Expected: `HTTP/1.1 403` with `{"error":"Sin acceso a este proyecto"}` (was 200 + a presigned URL before the fix).
- [ ] Repeat presign with A's **own** project UUID. Expected: `200` with `uploadUrl`/`publicUrl`/`key` (legit path still works).
- [ ] Call stream-upload with tenant B's **published** project UUID:
  ```bash
  curl -i -X POST "<PREVIEW_URL>/api/videos/stream/upload" \
    -H "content-type: application/json" \
    -H "cookie: <TENANT_A_SESSION_COOKIES>" \
    -d '{"proyecto_id":"<TENANT_B_PROJECT_UUID>","filename":"v.mp4"}'
  ```
  Expected: `HTTP/1.1 404` `{"error":"Proyecto no encontrado"}` and no new Cloudflare Stream upload created (was previously creating one).
- [ ] In the dashboard, delete a galería image from one of A's projects, then GET its former `url` and `thumbnail_url`. Expected: both return `400`/`404` (object gone from the `media` bucket), confirming the leak is closed.
- [ ] Record results in the PR description. Do NOT merge to `main` — request explicit owner approval per `WORKFLOW.md`.

---

## Task dependency / order

- **Task 0 (vitest harness)** must land first — Tasks 1-4 all depend on `npm test`.
- **Tasks 1, 2, 3, 4** are mutually independent (different files, different findings) and can be done in any order or in parallel after Task 0. Recommended priority: 1 → 2 (P0 cross-tenant writes) before 3 → 4 (P1 leaks).
- **Task 5 (manual verification)** depends on Tasks 1 and 2 being deployed to a `dev` preview; the galería-delete check additionally depends on Task 3.
- Branch B of Task 4 depends on Branch A of Task 4 and an owner decision.

## Per-task effort estimate

| Task | Scope | Estimate |
|------|-------|----------|
| 0 | Vitest harness bootstrap | 0.5d |
| 1 | media/presign ownership gate + test | 0.5d |
| 2 | stream-upload tenant scope + test | 0.25d |
| 3 | galería-delete storage cleanup + test (Branch A) | 0.5d |
| 4 | harden `deleteMediaFile` + bulk helper + test (Branch A) | 0.5d |
| 5 | manual cross-tenant verification on preview | 0.25d |

Total: ~2.5d (Branch A defaults). Branch B of Tasks 3/4 add ~0.25d each if the owner approves them.
