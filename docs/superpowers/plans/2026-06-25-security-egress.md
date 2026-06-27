# Webhook SSRF + Rate-limit/reCAPTCHA Hardening Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the server-side request forgery (SSRF) hole in the operator-configurable webhook dispatcher and harden the public ingress path (fail-closed reCAPTCHA, distributed rate limiting on the GHL proxy) so a tenant admin cannot use a webhook to reach internal/cloud-metadata endpoints and so anti-abuse controls work on serverless.

**Architecture:** Introduce a single pure egress guard module (`src/lib/ssrf-guard.ts`) that, given a URL, (1) enforces an `https:`-only / port allow-list / hostname-format check synchronously and (2) resolves the hostname via `node:dns/promises` and rejects any answer that is a loopback, private (RFC1918), link-local (incl. `169.254.169.254` cloud-metadata), unique-local IPv6, or otherwise non-public address. The webhook dispatcher (`src/lib/webhooks.ts`) calls the async guard immediately before `fetch`, pins the request to the validated IP family by disabling redirect-following (`redirect: "error"`), and the webhook config PUT route (`src/app/api/proyectos/[id]/webhooks/route.ts`) calls the synchronous guard at save time so bad URLs are rejected with a 400 before they are ever stored. Separately, `src/lib/recaptcha.ts` is made fail-closed in production while still allowing dev, and `src/app/api/marketing/ghl/route.ts` is migrated from its per-instance in-memory `Map` limiter to the shared Upstash `apiLimiter`.

**Tech Stack:** Next.js 16 route handlers (Node runtime), `node:dns/promises` + `node:net` (`isIP`) for DNS/IP classification, `@upstash/ratelimit` (existing `src/lib/rate-limit.ts`), Vitest (introduced in Task 0 for the pure-logic unit tests — see DECISION GATE).

**Branch / governance:** All work on a `fix/security-egress` branch cut from `dev` (per `WORKFLOW.md`). Never push `main`. Conventional commits (`feat`/`fix`/`chore`/`test`). Verify gate before **every** commit: `npm run typecheck && npm run lint` (and `npm test` after Task 0 lands Vitest). Source/config/migration files are only modified by the executor following this plan; this plan file is the only artifact written during planning.

---

### Task 0: Stand up the Vitest unit-test harness

> **DECISION GATE: How should the SSRF guard's pure logic be tested?**
> The repo currently has **no unit-test runner** — only Playwright e2e (`playwright.config.ts`) and `tsc`/`eslint`. `package.json` has no `test` script, and `node_modules/vitest` is absent. `WORKFLOW.md` says the verify gate is `npm run typecheck && npm run lint` "and `npm test` once vitest exists." The SSRF guard is pure, branch-heavy logic that MUST be unit-tested (it is the security boundary).
>
> - **Branch A (RECOMMENDED — introduce Vitest):** Add `vitest` as a devDependency, a minimal `vitest.config.ts`, and a `"test": "vitest run"` script. All later tasks use real Vitest specs. This is the higher-quality path and is exactly what `WORKFLOW.md` anticipates.
> - **Branch B (no new dependency — tsx verification script):** If the owner refuses a new devDependency, skip this task. In Tasks 1–4, replace each `*.test.ts` + `npm test` step with a standalone `scripts/verify-ssrf-guard.ts` (and friends) run via `npx tsx`, asserting with `node:assert` and `process.exit(1)` on failure. The guard code itself is identical; only the test runner differs.
>
> Tasks 1–4 below are written for **Branch A**. Each test step carries a parenthetical "(Branch B:)" note showing the tsx equivalent so execution can proceed under either decision.

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` devDependency + `test` script)
- Verify: `npm test`

- [ ] **Step 1 (Branch A only): Install Vitest as a devDependency**

```bash
npm install -D vitest@^3.2.4
```

Expected output (tail): `added 1 package` (plus its transitive deps) and no `ERESOLVE` error (`.npmrc` has `legacy-peer-deps=true`, so peer ranges resolve cleanly).

- [ ] **Step 2 (Branch A only): Create the Vitest config**

Create `vitest.config.ts` at the repo root. Use the Node environment (the guard is server-only) and resolve the `@/*` alias the same way `tsconfig.json` does so specs can `import { ... } from "@/lib/ssrf-guard"`. Exclude Playwright's directory so `vitest run` never picks up e2e specs.

```ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**", "e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
```

- [ ] **Step 3 (Branch A only): Add the `test` script to `package.json`**

In the `"scripts"` block of `package.json`, add a `test` entry next to the existing `test:e2e` scripts:

```json
"test": "vitest run",
"test:watch": "vitest",
```

- [ ] **Step 4 (Branch A only): Add a smoke spec and confirm the runner works**

Create `src/lib/__vitest-smoke__.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("vitest harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run it:

```bash
npm test
```

Expected output: `Test Files  1 passed (1)` / `Tests  1 passed (1)`, exit code 0.

Then delete the smoke file (it has served its purpose):

```bash
rm src/lib/__vitest-smoke__.test.ts
```

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint
```

Expected: `tsc` exits 0 (no output); `eslint` exits 0 (no errors). `vitest.config.ts` lives at the root and is excluded from `tsconfig` build noise via the existing include globs; if `tsc` flags it, it is only a type check and should pass since `vitest/config` ships types.

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore(test): add vitest unit-test harness for security guards"
```

(Branch B: skip this entire task. No commit. Proceed to Task 1 using the tsx-script test variants noted inline.)

---

### Task 1: Create the SSRF egress guard (pure logic + DNS resolution)

This is the security boundary. It exposes two functions: a **synchronous** format/scheme/port/IP-literal validator (used at config-save time and as the first gate at dispatch) and an **async** validator that additionally resolves the hostname and rejects private/loopback/link-local/metadata answers (used at dispatch time).

**Files:**
- Create: `src/lib/ssrf-guard.ts`
- Create (test): `src/lib/ssrf-guard.test.ts` (Branch B: `scripts/verify-ssrf-guard.ts`)
- Verify: `npm test`

- [ ] **Step 1: Write the failing unit test FIRST**

Create `src/lib/ssrf-guard.test.ts`. It covers: scheme rejection, IP-literal blocking (loopback v4/v6, RFC1918, link-local incl. metadata, `0.0.0.0`), hostname-format rejection, allowed public hostnames, and the async path rejecting a hostname that resolves to a private IP (DNS injected via a resolver override).

```ts
import { describe, it, expect } from "vitest";
import { validateEgressUrlSync, assertPublicEgressUrl } from "@/lib/ssrf-guard";

describe("validateEgressUrlSync", () => {
  it("rejects non-https schemes", () => {
    expect(validateEgressUrlSync("http://example.com/hook").ok).toBe(false);
    expect(validateEgressUrlSync("ftp://example.com").ok).toBe(false);
    expect(validateEgressUrlSync("file:///etc/passwd").ok).toBe(false);
    expect(validateEgressUrlSync("gopher://x").ok).toBe(false);
  });

  it("rejects malformed urls", () => {
    expect(validateEgressUrlSync("not a url").ok).toBe(false);
    expect(validateEgressUrlSync("https://").ok).toBe(false);
  });

  it("rejects credentials in the url (userinfo)", () => {
    expect(validateEgressUrlSync("https://user:pass@example.com").ok).toBe(false);
  });

  it("rejects disallowed ports", () => {
    expect(validateEgressUrlSync("https://example.com:22/hook").ok).toBe(false);
    expect(validateEgressUrlSync("https://example.com:8080/hook").ok).toBe(false);
  });

  it("allows https on default and 443", () => {
    expect(validateEgressUrlSync("https://example.com/hook").ok).toBe(true);
    expect(validateEgressUrlSync("https://example.com:443/hook").ok).toBe(true);
  });

  it("blocks ipv4 loopback / private / link-local / metadata / wildcard literals", () => {
    for (const u of [
      "https://127.0.0.1/x",
      "https://0.0.0.0/x",
      "https://10.0.0.5/x",
      "https://172.16.4.4/x",
      "https://192.168.1.10/x",
      "https://169.254.169.254/latest/meta-data/", // cloud metadata
      "https://100.64.0.1/x", // carrier-grade NAT
    ]) {
      expect(validateEgressUrlSync(u).ok).toBe(false);
    }
  });

  it("blocks ipv6 loopback / unique-local / link-local literals", () => {
    for (const u of [
      "https://[::1]/x",
      "https://[fc00::1]/x",
      "https://[fe80::1]/x",
      "https://[::ffff:127.0.0.1]/x", // ipv4-mapped loopback
    ]) {
      expect(validateEgressUrlSync(u).ok).toBe(false);
    }
  });

  it("blocks obvious internal hostnames by name", () => {
    for (const u of [
      "https://localhost/x",
      "https://metadata.google.internal/x",
      "https://foo.internal/x",
      "https://service.local/x",
    ]) {
      expect(validateEgressUrlSync(u).ok).toBe(false);
    }
  });

  it("allows a normal public hostname", () => {
    expect(validateEgressUrlSync("https://hooks.zapier.com/abc").ok).toBe(true);
  });
});

describe("assertPublicEgressUrl (DNS path)", () => {
  it("rejects a hostname that resolves to a private ip", async () => {
    const fakeResolve = async () => ["10.1.2.3"];
    await expect(
      assertPublicEgressUrl("https://evil.example.com/x", { resolve: fakeResolve }),
    ).rejects.toThrow(/private|internal|not allowed/i);
  });

  it("accepts a hostname that resolves to a public ip", async () => {
    const fakeResolve = async () => ["93.184.216.34"]; // example.com
    await expect(
      assertPublicEgressUrl("https://good.example.com/x", { resolve: fakeResolve }),
    ).resolves.toBeUndefined();
  });

  it("rejects when sync validation already fails (does not even resolve)", async () => {
    let called = false;
    const fakeResolve = async () => {
      called = true;
      return ["93.184.216.34"];
    };
    await expect(
      assertPublicEgressUrl("http://example.com/x", { resolve: fakeResolve }),
    ).rejects.toThrow();
    expect(called).toBe(false);
  });
});
```

(Branch B: put the same assertions in `scripts/verify-ssrf-guard.ts` using `import assert from "node:assert/strict"` and an async IIFE that `console.log("ok")` / `process.exit(1)` on throw; the import path stays `../src/lib/ssrf-guard` since tsx resolves relative paths. Run with `npx tsx scripts/verify-ssrf-guard.ts`.)

- [ ] **Step 2: Run the test — expect it to FAIL**

```bash
npm test -- src/lib/ssrf-guard.test.ts
```

Expected: failure with a module-resolution error, e.g. `Failed to load url @/lib/ssrf-guard` / `Cannot find module '@/lib/ssrf-guard'` (the file does not exist yet).

(Branch B: `npx tsx scripts/verify-ssrf-guard.ts` → `Cannot find module '../src/lib/ssrf-guard'`.)

- [ ] **Step 3: Implement the guard (minimal, real code)**

Create `src/lib/ssrf-guard.ts`. It uses `node:net`'s `isIP` for literal classification and `node:dns/promises` for hostname resolution (the `resolve` option is injectable so tests don't hit real DNS). Route handlers run on the Node runtime by default, so these modules are available.

```ts
import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

/** Result of a synchronous egress-URL check. */
export type EgressCheck = { ok: true; url: URL } | { ok: false; reason: string };

/** Ports we permit for outbound webhooks (https only). */
const ALLOWED_PORTS = new Set(["", "443"]);

/** Hostname suffixes / exact names that are always internal. */
const BLOCKED_HOST_SUFFIXES = [
  "localhost",
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home.arpa",
];

const BLOCKED_HOST_EXACT = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

/** Parse a dotted-quad into a 32-bit number, or null if not a v4 literal. */
function ipv4ToInt(ip: string): number | null {
  if (isIP(ip) !== 4) return null;
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return null;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** True if an IPv4 literal is in a non-public (private/reserved) range. */
function isPrivateIPv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true; // fail closed
  const inRange = (base: string, maskBits: number) => {
    const b = ipv4ToInt(base)!;
    const mask = maskBits === 0 ? 0 : (~0 << (32 - maskBits)) >>> 0;
    return (n & mask) === (b & mask);
  };
  return (
    inRange("0.0.0.0", 8) || // "this" network / 0.0.0.0
    inRange("10.0.0.0", 8) || // RFC1918
    inRange("100.64.0.0", 10) || // carrier-grade NAT
    inRange("127.0.0.0", 8) || // loopback
    inRange("169.254.0.0", 16) || // link-local incl. 169.254.169.254 metadata
    inRange("172.16.0.0", 12) || // RFC1918
    inRange("192.0.0.0", 24) || // IETF protocol assignments
    inRange("192.0.2.0", 24) || // TEST-NET-1
    inRange("192.168.0.0", 16) || // RFC1918
    inRange("198.18.0.0", 15) || // benchmarking
    inRange("198.51.100.0", 24) || // TEST-NET-2
    inRange("203.0.113.0", 24) || // TEST-NET-3
    inRange("224.0.0.0", 4) || // multicast
    inRange("240.0.0.0", 4) // reserved / 255.255.255.255
  );
}

/** True if an IPv6 literal (no brackets) is non-public. */
function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  // IPv4-mapped (::ffff:a.b.c.d) — classify the embedded v4.
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (lower === "::1" || lower === "::") return true; // loopback / unspecified
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local (fc00::/7)
  if (lower.startsWith("ff")) return true; // multicast
  return false;
}

/** Classify any IP literal (v4 or v6) as non-public. */
function isPrivateIpLiteral(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateIPv4(ip);
  if (v === 6) return isPrivateIPv6(ip);
  return true; // not an IP literal -> caller handles hostnames separately
}

function hostnameLooksInternal(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOST_EXACT.has(h)) return true;
  return BLOCKED_HOST_SUFFIXES.some((s) =>
    s.startsWith(".") ? h.endsWith(s) : h === s,
  );
}

/**
 * Synchronous structural check: scheme, userinfo, port, and — for IP literals
 * and obviously-internal names — reachability class. Does NOT resolve DNS.
 */
export function validateEgressUrlSync(raw: string): EgressCheck {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: "URL inválida" };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "La URL debe usar HTTPS" };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "La URL no puede incluir credenciales" };
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    return { ok: false, reason: "Puerto no permitido (solo 443)" };
  }

  // Strip brackets for IPv6 literals before classifying.
  const host = url.hostname.replace(/^\[/, "").replace(/\]$/, "");

  if (isIP(host) !== 0) {
    if (isPrivateIpLiteral(host)) {
      return { ok: false, reason: "La URL apunta a una dirección interna/privada" };
    }
    return { ok: true, url };
  }

  if (hostnameLooksInternal(host)) {
    return { ok: false, reason: "La URL apunta a un host interno" };
  }

  return { ok: true, url };
}

/** Injectable resolver so tests don't hit real DNS. Returns A/AAAA addresses. */
export type ResolveFn = (hostname: string) => Promise<string[]>;

const defaultResolve: ResolveFn = async (hostname) => {
  const results = await lookup(hostname, { all: true, verbatim: true });
  return results.map((r) => r.address);
};

/**
 * Full async guard: runs the sync check, then resolves the hostname and
 * rejects if ANY resolved address is non-public (defeats DNS-rebinding).
 * Throws an Error if the URL is not allowed.
 */
export async function assertPublicEgressUrl(
  raw: string,
  opts: { resolve?: ResolveFn } = {},
): Promise<void> {
  const check = validateEgressUrlSync(raw);
  if (!check.ok) {
    throw new Error(`Webhook URL rechazada: ${check.reason}`);
  }

  const host = check.url.hostname.replace(/^\[/, "").replace(/\]$/, "");

  // IP literals were already classified by the sync check.
  if (isIP(host) !== 0) return;

  const resolve = opts.resolve ?? defaultResolve;
  let addresses: string[];
  try {
    addresses = await resolve(host);
  } catch {
    throw new Error("Webhook URL rechazada: el host no se pudo resolver");
  }

  if (addresses.length === 0) {
    throw new Error("Webhook URL rechazada: el host no resolvió a ninguna IP");
  }
  for (const addr of addresses) {
    if (isPrivateIpLiteral(addr)) {
      throw new Error(
        "Webhook URL rechazada: el host resuelve a una IP interna/privada",
      );
    }
  }
}
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- src/lib/ssrf-guard.test.ts
```

Expected: `Test Files  1 passed (1)`, all `validateEgressUrlSync` and `assertPublicEgressUrl` cases green, exit code 0.

(Branch B: `npx tsx scripts/verify-ssrf-guard.ts` prints `ok` and exits 0.)

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck 0 errors, lint 0 errors, all tests pass.

```bash
git add src/lib/ssrf-guard.ts src/lib/ssrf-guard.test.ts
git commit -m "feat(security): add SSRF egress guard for outbound webhook urls"
```

(Branch B: `git add src/lib/ssrf-guard.ts scripts/verify-ssrf-guard.ts` and drop `npm test` from the gate.)

---

### Task 2: Enforce the guard in the webhook dispatcher

Wire `assertPublicEgressUrl` into `dispatchInternal` so the SSRF check runs at the moment of egress (defeating DNS-rebinding and stored-but-stale configs), block redirects, and record a clear `error` in `webhook_logs` when a URL is rejected. The current code does a bare `fetch(config.url, ...)` with default redirect-following at `src/lib/webhooks.ts:62`.

**Files:**
- Modify: `src/lib/webhooks.ts:58-90` (guard + `redirect: "error"` inside the `try`)
- Create (test): `src/lib/webhooks.test.ts` (Branch B: `scripts/verify-webhook-dispatch.ts`)
- Verify: `npm test`

- [ ] **Step 1: Write the failing test FIRST**

The dispatcher writes its outcome to `webhook_logs` via `createAdminClient()` and uses global `fetch`. Inject both by mocking the admin client module and stubbing `globalThis.fetch`. Assert that a URL resolving to a private IP is NEVER fetched and is logged with a rejection error, and that a public URL IS fetched.

Create `src/lib/webhooks.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Capture rows inserted into webhook_logs.
const inserted: Record<string, unknown>[] = [];

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        inserted.push(row);
        return Promise.resolve({ error: null });
      },
    }),
  }),
}));

// Force the SSRF guard to treat "internal.example.com" as private and
// "public.example.com" as public, without real DNS.
vi.mock("@/lib/ssrf-guard", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ssrf-guard")>();
  return {
    ...actual,
    assertPublicEgressUrl: (raw: string) =>
      actual.assertPublicEgressUrl(raw, {
        resolve: async (host) =>
          host === "internal.example.com" ? ["10.0.0.9"] : ["93.184.216.34"],
      }),
  };
});

import { dispatchWebhookForTest } from "@/lib/webhooks";

const basePayload = {
  event: "lead.created" as const,
  timestamp: new Date().toISOString(),
  proyecto_id: "p1",
  proyecto_nombre: "Demo",
  data: {},
};

describe("webhook dispatch SSRF enforcement", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    inserted.length = 0;
    fetchSpy = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does NOT fetch a webhook whose host resolves to a private ip", async () => {
    await dispatchWebhookForTest("p1", {
      enabled: true,
      url: "https://internal.example.com/hook",
      secret: "s",
      events: ["lead.created"],
    }, basePayload);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(inserted).toHaveLength(1);
    expect(inserted[0].delivered).toBe(false);
    expect(String(inserted[0].error)).toMatch(/interna|privada|rechazada/i);
  });

  it("DOES fetch a public webhook and pins redirect:error", async () => {
    await dispatchWebhookForTest("p1", {
      enabled: true,
      url: "https://public.example.com/hook",
      secret: "s",
      events: ["lead.created"],
    }, basePayload);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.redirect).toBe("error");
    expect(inserted[0].delivered).toBe(true);
  });
});
```

This test references a new awaitable export `dispatchWebhookForTest` (the internal dispatcher) so the spec can `await` the outcome — the public `dispatchWebhook` is intentionally fire-and-forget and cannot be awaited.

(Branch B: replicate in `scripts/verify-webhook-dispatch.ts` — stub `globalThis.fetch`, monkey-patch the admin client by setting env so `createAdminClient` is harmless, and assert with `node:assert/strict`. Because Branch B has no module mocker, inject the resolver by importing `dispatchInternal` directly and passing a test resolver via the new optional param added in Step 2.)

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm test -- src/lib/webhooks.test.ts
```

Expected: failure — `dispatchWebhookForTest` is not exported (`... is not a function`) and the internal dispatcher does not yet call the guard, so the "does NOT fetch" assertion would fail.

- [ ] **Step 3: Implement the guard call + redirect block (real edit)**

In `src/lib/webhooks.ts`, add the import at the top (after the existing imports on lines 1–2):

```ts
import { assertPublicEgressUrl } from "@/lib/ssrf-guard";
```

Replace the body of `dispatchInternal` from the `try {` (line 58) through the end of the `catch` (line 90) so the guard runs first and redirects are blocked. The current code is:

```ts
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "User-Agent": "NODDO-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = res.status;
    delivered = res.ok;

    const text = await res.text();
    responseBody = text.slice(0, 2000);

    if (!res.ok) {
      error = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      error = err.name === "AbortError" ? "Timeout (5s)" : err.message;
    } else {
      error = "Unknown error";
    }
  }
```

Replace it with (adds the SSRF assertion before `fetch`, `redirect: "error"`, and a dedicated rejection log path):

```ts
  try {
    // SSRF guard: validate scheme/port/host and resolve DNS, rejecting any
    // answer in a private/loopback/link-local/metadata range. Runs at egress
    // time so a stored-but-now-internal host (DNS rebinding) is still blocked.
    await assertPublicEgressUrl(config.url, opts.resolve ? { resolve: opts.resolve } : {});

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(config.url, {
      method: "POST",
      redirect: "error", // never follow redirects (redirect-based SSRF)
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Event": payload.event,
        "User-Agent": "NODDO-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    statusCode = res.status;
    delivered = res.ok;

    const text = await res.text();
    responseBody = text.slice(0, 2000);

    if (!res.ok) {
      error = `HTTP ${res.status}: ${res.statusText}`;
    }
  } catch (err) {
    if (err instanceof Error) {
      error = err.name === "AbortError" ? "Timeout (5s)" : err.message;
    } else {
      error = "Unknown error";
    }
  }
```

Update the `dispatchInternal` signature (line 44) to accept the optional injected resolver, and import the `ResolveFn` type. Change line 1–2 region to also import the type:

```ts
import type { ResolveFn } from "@/lib/ssrf-guard";
```

Change the signature from:

```ts
async function dispatchInternal(
  projectId: string,
  config: WebhookConfig,
  payload: WebhookPayload,
): Promise<void> {
```

to:

```ts
async function dispatchInternal(
  projectId: string,
  config: WebhookConfig,
  payload: WebhookPayload,
  opts: { resolve?: ResolveFn } = {},
): Promise<void> {
```

Then, at the bottom of the file (after `generateWebhookSecret`), add the awaitable test seam so specs can assert the outcome:

```ts
/**
 * Test-only awaitable wrapper around the internal dispatcher.
 * Production code must use `dispatchWebhook` (fire-and-forget).
 */
export function dispatchWebhookForTest(
  projectId: string,
  config: WebhookConfig,
  payload: WebhookPayload,
  opts: { resolve?: ResolveFn } = {},
): Promise<void> {
  return dispatchInternal(projectId, config, payload, opts);
}
```

(The public `dispatchWebhook` keeps its current signature and behavior; it calls `dispatchInternal(projectId, config, payload)` with no `opts`.)

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- src/lib/webhooks.test.ts
```

Expected: `Test Files  1 passed (1)` — the private host is never fetched and is logged with a rejection error; the public host is fetched once with `redirect: "error"` and logged `delivered: true`.

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all green.

```bash
git add src/lib/webhooks.ts src/lib/webhooks.test.ts
git commit -m "fix(security): enforce SSRF guard and block redirects in webhook dispatch"
```

---

### Task 3: Reject internal/private webhook URLs at save time (config PUT)

The PUT route at `src/app/api/proyectos/[id]/webhooks/route.ts:63-70` currently only validates that the protocol is `http:`/`https:`. Replace that block with the synchronous guard so an `http://`, internal, or private-literal URL is rejected with a 400 before being stored. (This is defense-in-depth alongside Task 2; the dispatcher remains the authoritative gate because of DNS-rebinding.)

**Files:**
- Modify: `src/app/api/proyectos/[id]/webhooks/route.ts:1-5` (import), `:63-70` (validation block)
- Create (test): `src/app/api/proyectos/[id]/webhooks/route.validation.test.ts` (Branch B: extend `scripts/verify-ssrf-guard.ts`)
- Verify: `npm test`

> Note: The route handler itself is hard to unit-test in isolation (it calls `getAuthContext()` + Supabase). The behavioral contract being added here — "the same sync guard the route uses rejects these URLs" — is fully covered by `validateEgressUrlSync` in Task 1. This task adds a thin spec asserting the exact error strings the route returns map 1:1 to the guard's reasons, plus a manual verification of the live 400.

- [ ] **Step 1: Write the failing test FIRST**

Create `src/app/api/proyectos/[id]/webhooks/route.validation.test.ts`. It asserts the guard rejects the URLs the route must reject and accepts a valid one — the precise inputs an operator could submit via `IntegracionesTab`.

```ts
import { describe, it, expect } from "vitest";
import { validateEgressUrlSync } from "@/lib/ssrf-guard";

describe("webhook config URL validation contract", () => {
  it("rejects http (downgrade)", () => {
    const r = validateEgressUrlSync("http://hooks.zapier.com/abc");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/HTTPS/);
  });

  it("rejects internal/private destinations a tenant might enter", () => {
    expect(validateEgressUrlSync("https://127.0.0.1:443/hook").ok).toBe(false);
    expect(validateEgressUrlSync("https://169.254.169.254/").ok).toBe(false);
    expect(validateEgressUrlSync("https://localhost/hook").ok).toBe(false);
    expect(validateEgressUrlSync("https://10.10.0.1/hook").ok).toBe(false);
  });

  it("accepts a legitimate Zapier/Make https endpoint", () => {
    expect(validateEgressUrlSync("https://hooks.zapier.com/hooks/catch/1/abc").ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect PASS for the guard, then we wire the route**

```bash
npm test -- src/app/api/proyectos/[id]/webhooks/route.validation.test.ts
```

Expected: PASS (the guard from Task 1 already satisfies this contract). This test locks the contract; the route edit in Step 3 makes the live route honor it. If Task 1 is not yet merged on this branch, expect a module-not-found FAIL until it is.

- [ ] **Step 3: Wire the guard into the route (real edit)**

In `src/app/api/proyectos/[id]/webhooks/route.ts`, add the import after the existing imports (lines 1–5):

```ts
import { validateEgressUrlSync } from "@/lib/ssrf-guard";
```

Replace the current `if (enabled) { ... }` URL validation (the inner `try { const parsed = new URL(url); ... }` at lines 63–70):

```ts
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "URL debe ser HTTP o HTTPS" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "URL inválida" }, { status: 400 });
      }
```

with:

```ts
      const urlCheck = validateEgressUrlSync(url);
      if (!urlCheck.ok) {
        return NextResponse.json({ error: urlCheck.reason }, { status: 400 });
      }
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- src/app/api/proyectos/[id]/webhooks/route.validation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Manual route verification (live 400)**

Run the dev server and POST a save with an internal URL while authenticated as a project owner (or inspect via the editor Integraciones tab). With `npm run dev` running:

```bash
curl -i -X PUT "http://localhost:3000/api/proyectos/<your-project-id>/webhooks" \
  -H "Content-Type: application/json" \
  -H "Cookie: <copy your sb auth cookies from the browser>" \
  -d '{"enabled":true,"url":"http://169.254.169.254/","events":["lead.created"]}'
```

Expected: `HTTP/1.1 400 Bad Request` with body `{"error":"La URL debe usar HTTPS"}`. Repeat with `"url":"https://10.0.0.1/x"` → `400` `{"error":"La URL apunta a una dirección interna/privada"}`. A valid `"url":"https://hooks.zapier.com/..."` returns `200`.

- [ ] **Step 6: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all green.

```bash
git add "src/app/api/proyectos/[id]/webhooks/route.ts" "src/app/api/proyectos/[id]/webhooks/route.validation.test.ts"
git commit -m "fix(security): reject internal/non-https webhook urls at config save"
```

---

### Task 4: Make reCAPTCHA fail-closed in production

`src/lib/recaptcha.ts:36-39` returns `true` (allows the request) when `RECAPTCHA_SECRET_KEY` is unset. That is correct for local dev but dangerous in production: a missing/rotated env var silently disables bot protection on the public lead endpoint. Change it to fail-closed when `NODE_ENV === "production"` while preserving the dev allow.

**Files:**
- Modify: `src/lib/recaptcha.ts:33-39`
- Create (test): `src/lib/recaptcha.test.ts` (Branch B: `scripts/verify-recaptcha.ts`)
- Verify: `npm test`

- [ ] **Step 1: Write the failing test FIRST**

Create `src/lib/recaptcha.test.ts`. It controls `process.env.RECAPTCHA_SECRET_KEY` and `process.env.NODE_ENV` and asserts: no key in production → `false`; no key in dev → `true`; and (with a stubbed `fetch`) a valid token with a key → `true`.

```ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { verifyRecaptcha } from "@/lib/recaptcha";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
});

describe("verifyRecaptcha fail-closed behavior", () => {
  it("returns false when the secret key is missing in production", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "production");
    const ok = await verifyRecaptcha("tok", "lead_submit");
    expect(ok).toBe(false);
  });

  it("returns true when the secret key is missing in development (dev bypass)", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    vi.stubEnv("NODE_ENV", "development");
    const ok = await verifyRecaptcha("tok", "lead_submit");
    expect(ok).toBe(true);
  });

  it("verifies a good token when configured", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ success: true, score: 0.9, action: "lead_submit" }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
    const ok = await verifyRecaptcha("tok", "lead_submit", 0.5);
    expect(ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test — expect FAIL**

```bash
npm test -- src/lib/recaptcha.test.ts
```

Expected: the first case FAILS — current code returns `true` (dev-mode allow) when the key is missing regardless of `NODE_ENV`, so `expect(ok).toBe(false)` fails.

- [ ] **Step 3: Implement fail-closed (real edit)**

In `src/lib/recaptcha.ts`, replace the current missing-key block (lines 35–39):

```ts
  // If not configured, allow (dev mode)
  if (!secretKey) {
    console.warn("⚠️ RECAPTCHA_SECRET_KEY not configured - verification skipped");
    return true;
  }
```

with:

```ts
  // If not configured: allow in dev (so local forms work), but FAIL CLOSED in
  // production so a missing/rotated env var cannot silently disable bot protection.
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.error("🚨 RECAPTCHA_SECRET_KEY missing in production — rejecting request");
      return false;
    }
    console.warn("⚠️ RECAPTCHA_SECRET_KEY not configured - verification skipped (dev)");
    return true;
  }
```

- [ ] **Step 4: Run the test — expect PASS**

```bash
npm test -- src/lib/recaptcha.test.ts
```

Expected: `Test Files  1 passed (1)`, all three cases green.

- [ ] **Step 5: Verify gate + commit**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: all green.

```bash
git add src/lib/recaptcha.ts src/lib/recaptcha.test.ts
git commit -m "fix(security): fail-closed reCAPTCHA verification in production"
```

---

### Task 5: Migrate `/api/marketing/ghl` to distributed (Upstash) rate limiting

`src/app/api/marketing/ghl/route.ts:12-27` uses a per-process `Map` limiter. On Vercel serverless this is per-instance and resets on every cold start, so an attacker hitting many concurrent lambdas is effectively unthrottled. Replace it with the shared `apiLimiter` from `src/lib/rate-limit.ts` (Upstash-backed, already used by `/api/track` and `/api/cotizaciones`), keeping the same 429 contract. The upstream `fetch` here targets a trusted `process.env.NEXT_PUBLIC_SUPABASE_URL` edge function, so it is NOT an SSRF surface and is intentionally left as-is.

**Files:**
- Modify: `src/app/api/marketing/ghl/route.ts:1-41` (remove Map limiter, use `isRateLimited`/`apiLimiter`)
- Verify: `npm run typecheck && npm run lint` + manual 429 check

> Note: This route's value depends on live Upstash + Supabase env and an authenticated edge function; a meaningful unit test would only re-test `checkRateLimit`/`isRateLimited`, which belong to `rate-limit.ts`. Verification here is typecheck + lint + a manual burst check, matching how `/api/track` and `/api/cotizaciones` are already wired.

- [ ] **Step 1: Replace the in-memory limiter with the shared limiter (real edit)**

In `src/app/api/marketing/ghl/route.ts`, add the import at the top of the file (after the existing `next/server` import on line 1):

```ts
import { isRateLimited, apiLimiter } from "@/lib/rate-limit";
```

Delete the entire in-memory limiter block (lines 12–27):

```ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}
```

Then replace the IP-derivation + check at the start of `POST` (lines 30–41):

```ts
export async function POST(req: NextRequest) {
  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
```

with (the shared `isRateLimited(req, limiter)` derives the identifier itself and is Upstash-backed; it returns `false` when Upstash env is absent, matching the other public routes):

```ts
export async function POST(req: NextRequest) {
  // Distributed rate limit (Upstash) — shared with /api/track & /api/cotizaciones.
  if (await isRateLimited(req, apiLimiter)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }
```

Note: the local helper was named `isRateLimited(ip: string)`; after this edit the only `isRateLimited` in scope is the imported `isRateLimited(req, limiter)`. There are no other references to `rateLimitMap`, `RATE_LIMIT`, or `RATE_WINDOW_MS` in the file (confirmed: they appear only in the deleted block), so removal is clean.

- [ ] **Step 2: Verify gate (typecheck + lint)**

```bash
npm run typecheck && npm run lint
```

Expected: `tsc` 0 errors (the old `ip` variable and Map symbols are gone, the imported `isRateLimited` signature matches the new call), `eslint` 0 errors/warnings (no unused `ip`/`rateLimitMap`).

- [ ] **Step 3: Manual burst verification**

With Upstash env vars set locally (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) and `npm run dev` running, send a burst above the `apiLimiter` window (100 / 10s) and confirm a 429 appears:

```bash
for i in $(seq 1 120); do \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3000/api/marketing/ghl" \
    -H "Content-Type: application/json" -d '{"email":"a@b.com","name":"x"}'; \
done | sort | uniq -c
```

Expected: a mix that includes `429` once the window is exceeded (exact split depends on the edge function responses; the key assertion is that `429` appears). If Upstash env is not set locally, `isRateLimited` returns `false` and no 429 appears — that is the intended dev fallback; verify in that case only that requests return non-500 codes and the build is clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/marketing/ghl/route.ts"
git commit -m "fix(security): use distributed Upstash rate limiting on ghl proxy"
```

---

### Task 6: Finalize — full verify, document, and open PR to `dev`

**Files:**
- Verify: full gate
- No source changes (review + PR only)

- [ ] **Step 1: Run the complete verify gate one final time**

```bash
npm run typecheck && npm run lint && npm test
```

Expected: typecheck 0 errors, lint 0 errors, `Test Files` all passed (ssrf-guard, webhooks, recaptcha, and the route-validation contract specs). Branch B: run `npx tsx scripts/verify-ssrf-guard.ts`, `npx tsx scripts/verify-webhook-dispatch.ts`, `npx tsx scripts/verify-recaptcha.ts` — each prints `ok` and exits 0.

- [ ] **Step 2: Confirm the branch is off `dev` and push**

```bash
git fetch origin
git log --oneline origin/dev -1   # sanity: branch base
git push -u origin fix/security-egress
```

Expected: branch pushes; no `main` involvement.

- [ ] **Step 3: Open the PR targeting `dev` (never `main`)**

```bash
gh pr create --base dev --head fix/security-egress \
  --title "Webhook SSRF + rate-limit/reCAPTCHA hardening" \
  --body "Closes the SSRF hole in the operator-configurable webhook dispatcher (DNS-resolving egress guard blocking loopback/RFC1918/link-local/metadata + redirect:error + save-time validation), makes reCAPTCHA fail-closed in production, and moves the /api/marketing/ghl limiter to distributed Upstash. Adds the Vitest harness + unit specs for all guard logic.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

Expected: PR URL printed, base `dev`. Do NOT merge to `main` without explicit owner approval (per `WORKFLOW.md`).

---

## Task dependency / order

- **Task 0 (Vitest harness)** — gated by the DECISION GATE. Must land first under Branch A because every later task's test step uses `npm test`. Under Branch B it is skipped and later tasks use `npx tsx` scripts.
- **Task 1 (ssrf-guard.ts)** — foundational; Tasks 2 and 3 both import from it. Do first after Task 0.
- **Task 2 (dispatcher enforcement)** — depends on Task 1.
- **Task 3 (config-save validation)** — depends on Task 1; independent of Task 2 (can run in parallel with Task 2 once Task 1 is merged).
- **Task 4 (reCAPTCHA fail-closed)** — fully independent of Tasks 1–3 (only touches `recaptcha.ts`); can be done any time after Task 0.
- **Task 5 (GHL Upstash limiter)** — fully independent (only touches `ghl/route.ts` + imports existing `rate-limit.ts`); needs no Vitest, can be done any time.
- **Task 6 (finalize/PR)** — last; depends on all of the above.

Recommended serial order: 0 → 1 → 2 → 3 → 4 → 5 → 6. If parallelizing, 4 and 5 may proceed alongside 1–3 once 0 is merged.

## Per-task effort estimate

| Task | Description | Estimate |
|------|-------------|----------|
| 0 | Vitest harness (Branch A) / skipped (Branch B) | 0.5d (A) / 0d (B) |
| 1 | SSRF egress guard + unit tests | 1d |
| 2 | Dispatcher enforcement + redirect block + test | 0.5d |
| 3 | Config-save validation + contract test + manual 400 | 0.5d |
| 4 | reCAPTCHA fail-closed + test | 0.25d |
| 5 | GHL proxy → Upstash limiter + manual burst | 0.25d |
| 6 | Final verify + PR to dev | 0.25d |

**Total: ~3–3.5d** (Branch A) / ~2.5–3d (Branch B).
