# Storage Upload/Presign Cross-Tenant Authorization Remediation Plan

> Subsystem clusterKey: `storage-authz`
> Branch: `fix/storage-authz` (cut **off `dev`**, never off/into `main`) per WORKFLOW.md.
> Conventional commits only. Verify gate before **every** commit: `npm run typecheck && npm run lint && npm test`.

## Goal

Close the cross-tenant authorization holes in the storage upload/presign API surface so an authenticated tenant can only write R2/Supabase Storage objects (and create Cloudflare Stream uploads) under projects their admin account actually owns, while still allowing the small set of legitimate non-project ("global/per-user") upload folders.

## Architecture

Every storage-writing route is gated by `getAuthContext()` + `requirePermission()` today, but the **object key / target project is taken verbatim from the client** in four routes (`/api/upload`, `/api/media/presign`, `/api/videos/stream/upload`, and read-route `/api/proyectos/[id]/storage`), and the project-existence checks that do exist rely on the `proyectos` SELECT RLS policy `"Authorized select projects"`, which returns **any `estado='publicado'` project to any authenticated user** — so a bare `.select("id").eq("id", proyecto_id)` passes for a victim's published project. The fix introduces one shared, RLS-independent authorization primitive in `src/lib/storage-authz.ts` — `resolveUploadTarget(auth, folder)` — that classifies a requested folder as either a *project folder* (`proyectos/<uuid>/...`, requiring `verifyProjectOwnership(auth, uuid)` which checks `user_id = auth.adminUserId`) or one of a **strict allowlist** of global folders (per-user namespaced where they currently leak), and rejects everything else. All four routes are refactored to call it (or `verifyProjectOwnership` directly), the `bucket` field is pinned to `media`, and the cross-tenant `videos/stream/upload` and `proyectos/[id]/storage` ownership checks are tightened to `auth.adminUserId`.

## Tech Stack

- Next.js 16 Route Handlers (`src/app/api/**/route.ts`), React 19 client callers (untouched by the security fix except one prop default).
- Auth: `@/lib/auth-context` (`getAuthContext`, `requirePermission`, `verifyProjectOwnership`, `getAccessibleProjectIds`).
- Storage: `@/lib/r2` (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), Supabase Storage via `@/lib/supabase/admin` (`createAdminClient`), Cloudflare Stream via `@/lib/cloudflare-stream`.
- Tests: **Vitest** (introduced in Task 0; repo currently only has Playwright e2e). TypeScript strict, path alias `@/* -> ./src/*`.

---

## Verified findings (current state)

| # | Route / file | Hole | Evidence |
|---|---|---|---|
| F1 | `src/app/api/upload/route.ts` | Accepts client `bucket` + `folder`, writes via **service-role admin client** with **no project-ownership check** (proyectoId only parsed to bump a counter, lines 98-100). Any authenticated `upload.files` user can overwrite (`upsert:true`) any object in any project's folder, or any bucket. | route.ts:48-54, 95-126 |
| F2 | `src/app/api/media/presign/route.ts` + `src/lib/r2.ts:getPresignedMediaUploadUrl` | Presigns `PUT` to `${folder}/${fileName}` from the **client-supplied `folder`** with **no ownership check**; the `auth.user.id` passed as `projectId` (route.ts:52) is **discarded** by the lib (r2.ts:130-149 never uses it). Cross-tenant write to `noddo-media`. | route.ts:51-57, r2.ts:130-150 |
| F3 | `src/app/api/videos/stream/upload/route.ts` | Ownership check `select("id").eq("id", proyecto_id)` **omits `.eq("user_id", auth.adminUserId)`** (lines 24-28); passes via RLS for any *published* project. Creates a Cloudflare Stream direct-upload URL bound to the victim's `proyecto_id`. (The subsequent `videos` INSERT is then blocked by the `"Owner write videos"` RLS `WITH CHECK auth.uid()=user_id`, but the Stream upload URL is already minted and the route's own check is the security boundary.) | route.ts:23-38 |
| F4 | `src/app/api/proyectos/[id]/storage/route.ts` (GET) | `select(...).eq("id", id)` with **no `.eq("user_id", auth.adminUserId)`** (lines 48-54); leaks another tenant's storage byte counts for any published project, and `?refresh=true` recomputes/writes `storage_media_bytes` on a project the caller may not own. | route.ts:48-94 |

**Correct reference implementations already in the repo** (the pattern to copy): `src/app/api/tours/presign/route.ts:33-45` and `src/app/api/tours/upload-file/route.ts:34-46` both do `.eq("id", proyecto_id).eq("user_id", auth.adminUserId)`. The canonical helper is `verifyProjectOwnership(auth, projectId)` in `src/lib/auth-context.ts:173-184` (already used by 8+ routes, e.g. `src/app/api/galeria/categorias/route.ts:21`).

**Legitimate non-project upload folders** (must keep working — enumerated from all `<FileUploader folder=...>` props and `formData.append("folder", ...)` callers):
`avances` (RichTextEditor.tsx:194, avances/page.tsx:407), `audio` (editor/[id]/page.tsx:194), `ai-creator` (crear/page.tsx:99), `portals/logos` (portal/page.tsx:533), and `planos` (PlanoHotspotEditor default, but always used inside a project editor). The only legitimate `bucket` value is `media` (all 7 callers send `"media"`).

> DECISION GATE (applies to Task 1 only — does **not** block Tasks 0/2/3/4): see the callout in Task 1 for whether global folders are per-user-namespaced (recommended, default branch A) or left flat with a documented residual risk (branch B). Tasks 0,2,3,4 are unconditional.

---

## Task 0 — Bootstrap Vitest so security tests can run

WORKFLOW.md / CLAUDE.md require `npm test` in the verify gate "once vitest exists". It does not exist yet, so we add it first. No source files change.

**Files**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `"test"` + `"test:run"` scripts and devDependencies) — via npm CLI, not hand-editing
- Create: `src/lib/__tests__/storage-authz.smoke.test.ts` (throwaway smoke test, deleted at end of task)

**Steps**
- [ ] Install dev deps (legacy-peer-deps is already in `.npmrc`):
  ```bash
  npm install -D vitest@^3 @vitest/coverage-v8@^3
  ```
  Expected: `package.json` devDependencies now include `vitest` and `@vitest/coverage-v8`; exit 0.
- [ ] Create `vitest.config.ts` with the `@/*` alias mirroring `tsconfig.json` (`"@/*": ["./src/*"]`) and a Node environment (these are server-route/unit tests, no DOM needed):
  ```ts
  import { defineConfig } from "vitest/config";
  import { fileURLToPath } from "node:url";

  export default defineConfig({
    test: {
      environment: "node",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
      globals: true,
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  });
  ```
- [ ] Add scripts via npm so quoting is correct on Windows:
  ```bash
  npm pkg set scripts.test="vitest run"
  npm pkg set scripts.test:run="vitest run"
  ```
  Expected: `npm pkg get scripts.test` prints `"vitest run"`.
- [ ] Add a throwaway smoke test to prove the runner + alias work — `src/lib/__tests__/storage-authz.smoke.test.ts`:
  ```ts
  import { describe, it, expect } from "vitest";

  describe("vitest bootstrap", () => {
    it("runs", () => {
      expect(1 + 1).toBe(2);
    });
  });
  ```
- [ ] Run it:
  ```bash
  npm test
  ```
  Expected: Vitest prints `1 passed (1)` and exits 0.
- [ ] Ensure Playwright e2e specs are NOT picked up by Vitest. Confirm with:
  ```bash
  npx vitest run --reporter=verbose 2>&1 | grep -i "playwright" || echo "no playwright specs collected"
  ```
  Expected: prints `no playwright specs collected` (the `include` glob only matches `src/**`; e2e lives under `tests/` or `e2e/`). If any e2e file under `src/**` is collected, add its path to a `test.exclude` array in `vitest.config.ts` and re-run.
- [ ] Delete the smoke test:
  ```bash
  rm src/lib/__tests__/storage-authz.smoke.test.ts
  ```
- [ ] Verify gate (typecheck + lint; `npm test` would now report "no test files" which is fine — there are no tests yet):
  ```bash
  npm run typecheck && npm run lint
  ```
  Expected: both exit 0.
- [ ] Commit:
  ```bash
  git checkout -b fix/storage-authz
  git add vitest.config.ts package.json package-lock.json
  git commit -m "chore: bootstrap vitest test runner"
  ```

---

## Task 1 — Add the shared upload-target authorization primitive (`resolveUploadTarget`)

This is the heart of the fix: one function that classifies a client-supplied `folder` and enforces ownership. Tasks 2 & 3 consume it.

> DECISION GATE: **Global (non-project) folders — per-user namespacing vs. flat shared.**
> The folders `avances`, `audio`, `ai-creator`, `portals/logos` are currently flat buckets shared across ALL tenants in the `media` Supabase bucket, so object keys can collide and one tenant can overwrite/read another's global asset (lower severity than the project-folder hole, but still cross-tenant).
> - **Branch A (RECOMMENDED, default): namespace global folders per admin account.** `resolveUploadTarget` rewrites an allowlisted global folder `X` to `users/<auth.adminUserId>/X`. New uploads become tenant-isolated; the returned (rewritten) key is what gets stored back into project JSON, so reads keep working for new assets. Existing flat assets keep their old public URLs (already persisted in `proyecto_versiones` snapshots) and are untouched — no migration needed.
> - **Branch B: leave global folders flat.** Allowlist them as-is; accept and document the residual shared-namespace risk. Zero URL changes.
> Both branches are fully specified below; the test asserts the chosen branch. Default to **A** unless the owner says otherwise. The ONLY code difference is the `GLOBAL_FOLDER_PREFIX` constant + one `return` line in `resolveUploadTarget`, called out inline.

**Files**
- Create: `src/lib/storage-authz.ts`
- Test: `src/lib/__tests__/storage-authz.test.ts`

**Steps**

- [ ] Write the failing test first — `src/lib/__tests__/storage-authz.test.ts`. It mocks `verifyProjectOwnership` from `@/lib/auth-context` and asserts every branch:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  // Mock only verifyProjectOwnership; keep the rest of the module intact.
  vi.mock("@/lib/auth-context", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/lib/auth-context")>();
    return { ...actual, verifyProjectOwnership: vi.fn() };
  });

  import { verifyProjectOwnership, type AuthContext } from "@/lib/auth-context";
  import { resolveUploadTarget } from "@/lib/storage-authz";

  const auth = { adminUserId: "admin-1", user: { id: "u-1" } } as unknown as AuthContext;
  const PID = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => vi.clearAllMocks());

  describe("resolveUploadTarget", () => {
    it("allows a project folder the caller owns", async () => {
      vi.mocked(verifyProjectOwnership).mockResolvedValue(true);
      const r = await resolveUploadTarget(auth, `proyectos/${PID}/galeria/x`);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.folder).toBe(`proyectos/${PID}/galeria/x`);
      expect(verifyProjectOwnership).toHaveBeenCalledWith(auth, PID);
    });

    it("rejects a project folder the caller does NOT own (cross-tenant)", async () => {
      vi.mocked(verifyProjectOwnership).mockResolvedValue(false);
      const r = await resolveUploadTarget(auth, `proyectos/${PID}/galeria/x`);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(403);
    });

    it("rejects a malformed proyectos folder with no/invalid uuid", async () => {
      const r = await resolveUploadTarget(auth, "proyectos/not-a-uuid/x");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(403);
      expect(verifyProjectOwnership).not.toHaveBeenCalled();
    });

    it("allows an allowlisted global folder", async () => {
      const r = await resolveUploadTarget(auth, "avances");
      expect(r.ok).toBe(true);
      // Branch A: per-user namespaced. Branch B: unchanged.
      if (r.ok) expect(r.folder).toBe("users/admin-1/avances"); // Branch A
      // Branch B assertion instead: if (r.ok) expect(r.folder).toBe("avances");
      expect(verifyProjectOwnership).not.toHaveBeenCalled();
    });

    it("allows a nested allowlisted global folder (portals/logos)", async () => {
      const r = await resolveUploadTarget(auth, "portals/logos");
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.folder).toBe("users/admin-1/portals/logos"); // Branch A
    });

    it("rejects an arbitrary non-allowlisted folder", async () => {
      const r = await resolveUploadTarget(auth, "victim-secret-folder");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(400);
    });

    it("rejects empty/missing folder", async () => {
      const r = await resolveUploadTarget(auth, "");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(400);
    });

    it("rejects path traversal even on an allowlisted prefix", async () => {
      const r = await resolveUploadTarget(auth, "avances/../proyectos/x");
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.status).toBe(400);
    });
  });
  ```
- [ ] Run it — expect FAIL (module does not exist yet):
  ```bash
  npm test -- src/lib/__tests__/storage-authz.test.ts
  ```
  Expected: `Failed to resolve import "@/lib/storage-authz"` / suite fails to load.
- [ ] Implement `src/lib/storage-authz.ts` (minimal, real code). **Branch A shown** (per-user namespacing); for Branch B set `GLOBAL_FOLDER_PREFIX = ""` and return `folder` unchanged in the global branch (noted inline):
  ```ts
  import { verifyProjectOwnership, type AuthContext } from "@/lib/auth-context";

  /** Strict allowlist of non-project upload folders (kept in sync with the
   *  <FileUploader folder=...> props and formData "folder" callers). */
  const GLOBAL_FOLDERS = new Set<string>([
    "avances",
    "audio",
    "ai-creator",
    "planos",
    "portals/logos",
  ]);

  /** Branch A: per-tenant namespace. Branch B: set to "" and skip the rewrite. */
  const GLOBAL_FOLDER_PREFIX = "users";

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  export type ResolveResult =
    | { ok: true; folder: string; projectId: string | null }
    | { ok: false; status: 400 | 403; error: string };

  /**
   * Authorize a client-supplied upload `folder` and return the *server-trusted*
   * folder to actually write under. Never trust the raw client folder past this.
   *
   * - `proyectos/<uuid>/...`  -> requires verifyProjectOwnership(auth, uuid).
   * - allowlisted global folder -> allowed (Branch A: namespaced per admin).
   * - anything else            -> rejected.
   */
  export async function resolveUploadTarget(
    auth: AuthContext,
    folder: string | null | undefined,
  ): Promise<ResolveResult> {
    if (!folder || typeof folder !== "string") {
      return { ok: false, status: 400, error: "folder requerido" };
    }

    // Reject traversal / absolute / backslash anywhere up front.
    if (
      folder.includes("..") ||
      folder.startsWith("/") ||
      folder.includes("\\")
    ) {
      return { ok: false, status: 400, error: "Ruta de carpeta inválida" };
    }

    const segments = folder.split("/");

    // Project folder: proyectos/<uuid>/...
    if (segments[0] === "proyectos") {
      const projectId = segments[1];
      if (!projectId || !UUID_RE.test(projectId)) {
        return { ok: false, status: 403, error: "Proyecto no autorizado" };
      }
      const owns = await verifyProjectOwnership(auth, projectId);
      if (!owns) {
        return { ok: false, status: 403, error: "Proyecto no autorizado" };
      }
      return { ok: true, folder, projectId };
    }

    // Global folder allowlist.
    if (GLOBAL_FOLDERS.has(folder)) {
      // Branch B: return { ok: true, folder, projectId: null };
      const namespaced = GLOBAL_FOLDER_PREFIX
        ? `${GLOBAL_FOLDER_PREFIX}/${auth.adminUserId}/${folder}`
        : folder;
      return { ok: true, folder: namespaced, projectId: null };
    }

    return { ok: false, status: 400, error: "Carpeta no permitida" };
  }
  ```
- [ ] Run the test — expect PASS:
  ```bash
  npm test -- src/lib/__tests__/storage-authz.test.ts
  ```
  Expected: `8 passed`. (If Branch B was chosen, the two namespaced assertions were swapped to the `"avances"` / `"portals/logos"` literals before this run.)
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0.
- [ ] Commit:
  ```bash
  git add src/lib/storage-authz.ts src/lib/__tests__/storage-authz.test.ts
  git commit -m "feat: add resolveUploadTarget upload authorization primitive"
  ```

---

## Task 2 — Enforce ownership in `/api/upload` (F1) and pin the bucket

**Files**
- Modify: `src/app/api/upload/route.ts` (insert auth between current lines 45 and 48; pin bucket; use resolved folder)
- Test: `src/app/api/upload/__tests__/route.test.ts`

**Steps**

- [ ] Write the failing test — `src/app/api/upload/__tests__/route.test.ts`. It mocks `getAuthContext`, `requirePermission`, `resolveUploadTarget`, and `createAdminClient`, then asserts the route returns 403 when `resolveUploadTarget` rejects, 400 for a non-`media` bucket, and only reaches storage on success:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(),
    requirePermission: vi.fn(() => null),
  }));
  vi.mock("@/lib/storage-authz", () => ({ resolveUploadTarget: vi.fn() }));
  vi.mock("@/lib/error-reporter", () => ({ reportApiError: vi.fn() }));

  const uploadMock = vi.fn(() => Promise.resolve({ error: null }));
  const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: "https://cdn/x" } }));
  vi.mock("@/lib/supabase/admin", () => ({
    createAdminClient: vi.fn(() => ({
      storage: {
        from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }),
      },
      rpc: vi.fn(() => ({ then: vi.fn() })),
    })),
  }));

  import { getAuthContext } from "@/lib/auth-context";
  import { resolveUploadTarget } from "@/lib/storage-authz";
  import { POST } from "../route";

  const auth = { user: { id: "u-1" }, adminUserId: "admin-1", role: "admin" };

  function req(fields: Record<string, string | Blob>) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(fields)) fd.append(k, v);
    return { formData: () => Promise.resolve(fd) } as unknown as Request;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(auth as never);
  });

  describe("POST /api/upload authorization", () => {
    it("returns 403 when resolveUploadTarget rejects a cross-tenant folder", async () => {
      vi.mocked(resolveUploadTarget).mockResolvedValue({
        ok: false, status: 403, error: "Proyecto no autorizado",
      });
      const res = await POST(req({
        file: new File(["x"], "x.pdf", { type: "application/pdf" }),
        bucket: "media",
        folder: "proyectos/22222222-2222-2222-2222-222222222222/galeria",
      }) as never);
      expect(res.status).toBe(403);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it("returns 400 for a non-media bucket", async () => {
      vi.mocked(resolveUploadTarget).mockResolvedValue({
        ok: true, folder: "avances", projectId: null,
      });
      const res = await POST(req({
        file: new File(["x"], "x.pdf", { type: "application/pdf" }),
        bucket: "evil-bucket",
        folder: "avances",
      }) as never);
      expect(res.status).toBe(400);
      expect(uploadMock).not.toHaveBeenCalled();
    });

    it("uploads under the SERVER-RESOLVED folder, not the raw client folder", async () => {
      vi.mocked(resolveUploadTarget).mockResolvedValue({
        ok: true, folder: "users/admin-1/avances", projectId: null,
      });
      const res = await POST(req({
        file: new File(["x"], "x.pdf", { type: "application/pdf" }),
        bucket: "media",
        folder: "avances",
      }) as never);
      expect(res.status).toBe(200);
      expect(uploadMock).toHaveBeenCalledTimes(1);
      const key = uploadMock.mock.calls[0][0] as string;
      expect(key.startsWith("users/admin-1/avances/")).toBe(true);
    });
  });
  ```
- [ ] Run it — expect FAIL (route still trusts client folder, has no bucket pin, doesn't import `resolveUploadTarget`):
  ```bash
  npm test -- src/app/api/upload/__tests__/route.test.ts
  ```
  Expected: assertions fail (e.g. first test gets 200 instead of 403).
- [ ] Implement. Edit `src/app/api/upload/route.ts`:
  - Add import near the top (after the `reportApiError` import on line 3):
    ```ts
    import { resolveUploadTarget } from "@/lib/storage-authz";
    ```
  - Replace the bucket/folder parsing + add authorization. Current lines 51-55 read:
    ```ts
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media";
    const folder = (formData.get("folder") as string) || "";
    ```
    Replace with (pin bucket, resolve+authorize folder, and from here on use `resolvedFolder`):
    ```ts
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "media";
    const requestedFolder = (formData.get("folder") as string) || "";

    // Only the public media bucket is writable through this route.
    if (bucket !== "media") {
      return NextResponse.json({ error: "Bucket no permitido" }, { status: 400 });
    }

    // Authorize the target folder (project ownership or global allowlist).
    const target = await resolveUploadTarget(auth, requestedFolder);
    if (!target.ok) {
      return NextResponse.json({ error: target.error }, { status: target.status });
    }
    const folder = target.folder;
    ```
  - The rest of the handler already derives `prefix` from `folder` (line 95) and parses `proyectoId` from `folder` (line 99) — both now operate on the trusted resolved folder, which is correct. No other change needed in this file.
- [ ] Run the test — expect PASS:
  ```bash
  npm test -- src/app/api/upload/__tests__/route.test.ts
  ```
  Expected: `3 passed`.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0.
- [ ] Commit:
  ```bash
  git add src/app/api/upload/route.ts src/app/api/upload/__tests__/route.test.ts
  git commit -m "fix: enforce tenant ownership and pin bucket in /api/upload"
  ```

> Caller compatibility note (no client change needed under Branch A): callers send the same flat folders (`avances`, `audio`, `ai-creator`, `portals/logos`, `proyectos/<id>/...`). The route now returns the namespaced public URL from `getPublicUrl(resolvedFolder/...)`, which the client persists as the asset URL — so new uploads resolve correctly. Under Branch B nothing about URLs changes at all.

---

## Task 3 — Enforce ownership in `/api/media/presign` (F2)

**Files**
- Modify: `src/app/api/media/presign/route.ts` (authorize folder before presigning; pass resolved folder)
- Modify: `src/lib/r2.ts` (`getPresignedMediaUploadUrl` — drop the misleading unused `projectId` param; key off the trusted folder)
- Test: `src/app/api/media/presign/__tests__/route.test.ts`

**Steps**

- [ ] Write the failing test — `src/app/api/media/presign/__tests__/route.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(),
    requirePermission: vi.fn(() => null),
  }));
  vi.mock("@/lib/storage-authz", () => ({ resolveUploadTarget: vi.fn() }));
  vi.mock("@/lib/error-reporter", () => ({ reportApiError: vi.fn() }));

  const presignMock = vi.fn(() =>
    Promise.resolve({ uploadUrl: "https://r2/put", publicUrl: "https://cdn/x", key: "k" }),
  );
  vi.mock("@/lib/r2", () => ({
    getPresignedMediaUploadUrl: presignMock,
    ensureMediaBucketCors: vi.fn(() => Promise.resolve()),
  }));

  import { getAuthContext } from "@/lib/auth-context";
  import { resolveUploadTarget } from "@/lib/storage-authz";
  import { POST } from "../route";

  const auth = { user: { id: "u-1", email: "a@b.c" }, adminUserId: "admin-1", role: "admin" };

  function jsonReq(body: unknown) {
    return { json: () => Promise.resolve(body) } as unknown as Request;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockResolvedValue(auth as never);
  });

  describe("POST /api/media/presign authorization", () => {
    it("returns 403 for a cross-tenant project folder and never presigns", async () => {
      vi.mocked(resolveUploadTarget).mockResolvedValue({
        ok: false, status: 403, error: "Proyecto no autorizado",
      });
      const res = await POST(jsonReq({
        folder: "proyectos/22222222-2222-2222-2222-222222222222/recursos",
        fileName: "a.pdf", contentType: "application/pdf", size: 10,
      }) as never);
      expect(res.status).toBe(403);
      expect(presignMock).not.toHaveBeenCalled();
    });

    it("presigns under the server-resolved folder on success", async () => {
      vi.mocked(resolveUploadTarget).mockResolvedValue({
        ok: true, folder: "proyectos/PID/recursos", projectId: "PID",
      });
      const res = await POST(jsonReq({
        folder: "proyectos/PID/recursos",
        fileName: "a.pdf", contentType: "application/pdf", size: 10,
      }) as never);
      expect(res.status).toBe(200);
      expect(presignMock).toHaveBeenCalledTimes(1);
      // first arg of getPresignedMediaUploadUrl is now the trusted folder
      expect(presignMock.mock.calls[0][0]).toBe("proyectos/PID/recursos");
    });
  });
  ```
- [ ] Run it — expect FAIL:
  ```bash
  npm test -- src/app/api/media/presign/__tests__/route.test.ts
  ```
  Expected: first test gets 200 (no authz) / `presignMock` called — assertions fail.
- [ ] Implement the route. Edit `src/app/api/media/presign/route.ts`:
  - Update the import on line 1-2 to add `resolveUploadTarget`:
    ```ts
    import { getAuthContext, requirePermission, type AuthContext } from "@/lib/auth-context";
    import { resolveUploadTarget } from "@/lib/storage-authz";
    import { getPresignedMediaUploadUrl, ensureMediaBucketCors } from "@/lib/r2";
    ```
  - After the existing field-presence + path-traversal + size checks (current lines 27-47), and **before** `await ensureMediaBucketCors();` (line 49), insert the authorization and switch to the resolved folder:
    ```ts
    // Authorize the target folder (project ownership or global allowlist).
    const target = await resolveUploadTarget(auth, folder);
    if (!target.ok) {
      return NextResponse.json({ error: target.error }, { status: target.status });
    }

    await ensureMediaBucketCors();

    const result = await getPresignedMediaUploadUrl(
      target.folder,
      fileName,
      contentType,
      size,
    );
    ```
    (This replaces the current `await ensureMediaBucketCors();` + `getPresignedMediaUploadUrl(auth.user.id, folder, ...)` block at lines 49-57 — note the old first arg `auth.user.id` is removed.)
- [ ] Implement the lib change. Edit `src/lib/r2.ts` — change the signature of `getPresignedMediaUploadUrl` (currently lines 130-150) to drop the unused `projectId` param so callers can't pass a meaningless value:
  ```ts
  export async function getPresignedMediaUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
    size: number,
  ): Promise<MediaPresignResult> {
    const client = getR2Client();
    const key = `${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_MEDIA_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 });
    const publicUrl = `${R2_MEDIA_PUBLIC_URL}/${key}`;

    return { uploadUrl, publicUrl, key };
  }
  ```
  (Body is unchanged except the removed first param; `size` stays in the signature for call-site compatibility / future quota use.)
- [ ] Confirm there are no other callers of the changed signature:
  ```bash
  grep -rn "getPresignedMediaUploadUrl" src --include=*.ts
  ```
  Expected: only `src/lib/r2.ts` (definition) and `src/app/api/media/presign/route.ts` (the call we just edited). If any other caller appears, update it to drop the first arg.
- [ ] Run the test — expect PASS:
  ```bash
  npm test -- src/app/api/media/presign/__tests__/route.test.ts
  ```
  Expected: `2 passed`.
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0 (typecheck confirms the route passes 4 args to the new 4-arg signature).
- [ ] Commit:
  ```bash
  git add src/app/api/media/presign/route.ts src/lib/r2.ts src/app/api/media/presign/__tests__/route.test.ts
  git commit -m "fix: enforce tenant ownership in /api/media/presign"
  ```

---

## Task 4 — Tighten ownership checks in `/api/videos/stream/upload` (F3) and `/api/proyectos/[id]/storage` (F4)

These two routes already take a `proyecto_id`/`id` and just need the missing `verifyProjectOwnership` guard (the exact `tours/*` pattern). No new primitive needed.

**Files**
- Modify: `src/app/api/videos/stream/upload/route.ts` (replace RLS-only existence check with `verifyProjectOwnership`)
- Modify: `src/app/api/proyectos/[id]/storage/route.ts` (add `verifyProjectOwnership` before reading)
- Test: `src/app/api/videos/stream/upload/__tests__/route.test.ts`
- Test: `src/app/api/proyectos/[id]/storage/__tests__/route.test.ts`

**Steps**

- [ ] Write the failing test for the videos route — `src/app/api/videos/stream/upload/__tests__/route.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(),
    requirePermission: vi.fn(() => null),
    verifyProjectOwnership: vi.fn(),
  }));
  const createDirectUploadMock = vi.fn(() =>
    Promise.resolve({ uid: "uid-1", uploadURL: "https://stream/up" }),
  );
  vi.mock("@/lib/cloudflare-stream", () => ({ createDirectUpload: createDirectUploadMock }));

  import { getAuthContext, verifyProjectOwnership } from "@/lib/auth-context";
  import { POST } from "../route";

  function jsonReq(body: unknown) {
    return { json: () => Promise.resolve(body) } as unknown as Request;
  }

  // Minimal supabase chain stub for the success path (insert + max-orden query).
  function makeAuth() {
    const chain = {
      from: vi.fn(() => chain),
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      limit: vi.fn(() => chain),
      single: vi.fn(() => Promise.resolve({ data: { orden: 0, id: "v-1" }, error: null })),
      insert: vi.fn(() => chain),
    };
    return { user: { id: "u-1" }, adminUserId: "admin-1", role: "admin", supabase: chain };
  }

  beforeEach(() => vi.clearAllMocks());

  describe("POST /api/videos/stream/upload authorization", () => {
    it("returns 404 and never mints a Stream upload for a non-owned project", async () => {
      vi.mocked(getAuthContext).mockResolvedValue(makeAuth() as never);
      vi.mocked(verifyProjectOwnership).mockResolvedValue(false);
      const res = await POST(jsonReq({ proyecto_id: "PID", filename: "v.mp4" }) as never);
      expect(res.status).toBe(404);
      expect(createDirectUploadMock).not.toHaveBeenCalled();
    });

    it("mints a Stream upload when the caller owns the project", async () => {
      vi.mocked(getAuthContext).mockResolvedValue(makeAuth() as never);
      vi.mocked(verifyProjectOwnership).mockResolvedValue(true);
      const res = await POST(jsonReq({ proyecto_id: "PID", filename: "v.mp4" }) as never);
      expect(res.status).toBe(200);
      expect(verifyProjectOwnership).toHaveBeenCalledWith(expect.anything(), "PID");
      expect(createDirectUploadMock).toHaveBeenCalledWith("PID");
    });
  });
  ```
- [ ] Write the failing test for the storage GET route — `src/app/api/proyectos/[id]/storage/__tests__/route.test.ts`:
  ```ts
  import { describe, it, expect, vi, beforeEach } from "vitest";

  vi.mock("@/lib/auth-context", () => ({
    getAuthContext: vi.fn(),
    requirePermission: vi.fn(() => null),
    verifyProjectOwnership: vi.fn(),
  }));

  import { getAuthContext, verifyProjectOwnership } from "@/lib/auth-context";
  import { GET } from "../route";

  function makeAuth() {
    const chain = {
      from: vi.fn(() => chain),
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      not: vi.fn(() => chain),
      single: vi.fn(() =>
        Promise.resolve({
          data: {
            storage_tours_bytes: 1, storage_videos_bytes: 0,
            storage_media_bytes: 2, storage_limit_bytes: 100,
          },
          error: null,
        }),
      ),
    };
    return { user: { id: "u-1" }, adminUserId: "admin-1", role: "admin", supabase: chain };
  }

  const ctx = { params: Promise.resolve({ id: "PID" }) };
  const req = { url: "https://x/api/proyectos/PID/storage" } as never;

  beforeEach(() => vi.clearAllMocks());

  describe("GET /api/proyectos/[id]/storage authorization", () => {
    it("returns 404 for a project the caller does not own", async () => {
      vi.mocked(getAuthContext).mockResolvedValue(makeAuth() as never);
      vi.mocked(verifyProjectOwnership).mockResolvedValue(false);
      const res = await GET(req, ctx as never);
      expect(res.status).toBe(404);
    });

    it("returns storage stats for an owned project", async () => {
      vi.mocked(getAuthContext).mockResolvedValue(makeAuth() as never);
      vi.mocked(verifyProjectOwnership).mockResolvedValue(true);
      const res = await GET(req, ctx as never);
      expect(res.status).toBe(200);
      expect(verifyProjectOwnership).toHaveBeenCalledWith(expect.anything(), "PID");
    });
  });
  ```
- [ ] Run both — expect FAIL:
  ```bash
  npm test -- src/app/api/videos/stream/upload/__tests__/route.test.ts src/app/api/proyectos/__tests__ src/app/api/proyectos/[id]/storage/__tests__/route.test.ts
  ```
  Expected: the "non-owned" tests get 200 instead of 404/404 — assertions fail.
- [ ] Implement the videos route. Edit `src/app/api/videos/stream/upload/route.ts`:
  - Update the import on line 1 to add `verifyProjectOwnership`:
    ```ts
    import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
    ```
  - Replace the existence check at current lines 23-35:
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
    with the ownership-checked version:
    ```ts
    // Verify project ownership (tenant-scoped, not RLS-published-leak prone)
    if (!(await verifyProjectOwnership(auth, proyecto_id))) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }
    ```
- [ ] Implement the storage GET route. Edit `src/app/api/proyectos/[id]/storage/route.ts`:
  - Update the import on line 1 to add `verifyProjectOwnership`:
    ```ts
    import { getAuthContext, requirePermission, verifyProjectOwnership } from "@/lib/auth-context";
    ```
  - Immediately after the `requirePermission` guard (current lines 44-45) and **before** the `proyectos` select (line 48), insert:
    ```ts
    if (!(await verifyProjectOwnership(auth, id))) {
      return NextResponse.json(
        { error: "Proyecto no encontrado" },
        { status: 404 }
      );
    }
    ```
    The subsequent `.select(...).eq("id", id).single()` stays as a data fetch (now guaranteed owned).
- [ ] Run both tests — expect PASS:
  ```bash
  npm test -- src/app/api/videos/stream/upload/__tests__/route.test.ts src/app/api/proyectos/[id]/storage/__tests__/route.test.ts
  ```
  Expected: `2 passed` each (4 total).
- [ ] Verify gate:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: all exit 0; the full Vitest run reports all storage-authz suites green.
- [ ] Commit:
  ```bash
  git add "src/app/api/videos/stream/upload/route.ts" "src/app/api/proyectos/[id]/storage/route.ts" "src/app/api/videos/stream/upload/__tests__/route.test.ts" "src/app/api/proyectos/[id]/storage/__tests__/route.test.ts"
  git commit -m "fix: enforce tenant ownership in stream upload and project storage routes"
  ```

---

## Task 5 — Full-suite verification and push to dev

**Files**
- No source changes (verification + integration only).

**Steps**
- [ ] Run the complete gate one last time from a clean state:
  ```bash
  npm run typecheck && npm run lint && npm test
  ```
  Expected: typecheck 0 errors; lint 0 errors; Vitest reports all suites passing — `storage-authz.test.ts` (8), `upload/route.test.ts` (3), `media/presign/route.test.ts` (2), `videos/stream/upload/route.test.ts` (2), `proyectos/[id]/storage/route.test.ts` (2) = 17 tests passed.
- [ ] Manual cross-tenant smoke (preview env, two accounts A and B; do NOT run against `main`/prod):
  - As tenant B, capture a session cookie, then `curl` each route targeting a project owned by A and an arbitrary folder:
    ```bash
    # Replace COOKIE and A_PROJECT_ID. All four MUST return 4xx, never 200.
    curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<preview>/api/media/presign \
      -H "Content-Type: application/json" -H "Cookie: <B_SESSION>" \
      -d '{"folder":"proyectos/<A_PROJECT_ID>/recursos","fileName":"x.pdf","contentType":"application/pdf","size":10}'
    # expect 403
    curl -s -o /dev/null -w "%{http_code}\n" -X POST https://<preview>/api/videos/stream/upload \
      -H "Content-Type: application/json" -H "Cookie: <B_SESSION>" \
      -d '{"proyecto_id":"<A_PROJECT_ID>","filename":"v.mp4"}'
    # expect 404
    curl -s -o /dev/null -w "%{http_code}\n" -X GET "https://<preview>/api/proyectos/<A_PROJECT_ID>/storage" \
      -H "Cookie: <B_SESSION>"
    # expect 404
    ```
  - As tenant B against **B's own** project + a real file via the dashboard FileUploader: confirm image, PDF, audio, and avances uploads still succeed (Branch A: new asset URLs contain `users/<B_admin_id>/...` for global folders; project assets unchanged at `proyectos/<B_id>/...`).
  Expected: all cross-tenant calls 4xx; all same-tenant uploads succeed and render.
- [ ] Push the branch (preview deploy only — NOT main):
  ```bash
  git push -u origin fix/storage-authz
  ```
  Expected: branch pushed; Vercel preview builds green.
- [ ] Open a PR `fix/storage-authz -> dev` (owner reviews/merges; production promotion to `main` requires separate explicit owner approval per WORKFLOW.md). Do not merge to `main`.

---

## Task dependency / order

```
Task 0 (vitest bootstrap)
   └─> Task 1 (resolveUploadTarget)   [DECISION GATE A/B; does not block 2 once decided]
          ├─> Task 2 (/api/upload)
          └─> Task 3 (/api/media/presign + r2.ts)
Task 4 (videos/stream + proyectos/[id]/storage)  -- independent of 1/2/3; needs only Task 0
Task 5 (full verify + push)  -- after 2, 3, 4
```

- Task 0 must run first (the verify gate's `npm test` needs Vitest).
- Tasks 2 and 3 both depend on Task 1's `resolveUploadTarget`.
- Task 4 depends only on Task 0 (uses the existing `verifyProjectOwnership`); it can be done in parallel with Tasks 1-3.
- The DECISION GATE in Task 1 only affects two assertions and one constant; resolve it before running Task 1's test, but it does not block starting Task 4 or Task 0.

## Per-task effort estimate

| Task | Scope | Estimate |
|---|---|---|
| 0 | Vitest bootstrap (config + scripts + smoke) | 0.5d |
| 1 | `resolveUploadTarget` + 8 unit tests (+ A/B decision) | 0.5d |
| 2 | `/api/upload` ownership + bucket pin + 3 tests | 0.5d |
| 3 | `/api/media/presign` + `r2.ts` signature + 2 tests | 0.5d |
| 4 | videos/stream + proyectos/[id]/storage + 4 tests | 0.5d |
| 5 | Full gate + cross-tenant smoke + PR to dev | 0.5d |
| **Total** | | **~3d** |
