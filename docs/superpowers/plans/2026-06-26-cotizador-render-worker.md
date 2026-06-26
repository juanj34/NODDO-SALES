# NODDO Render Worker (Generic HTML→PDF) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-contained, generic, app-agnostic HTML→PDF render worker (`render-worker/` at the NODDO repo root) that takes fully self-contained HTML over HTTP and returns PDF bytes via headless Chromium, deployable to Railway, so the NODDO app can stop generating quote PDFs inside the Vercel serverless route and instead POST premium HTML to this worker.

**Architecture:** A plain Node HTTP server (`server.mjs`, ESM, zero npm deps — Node builtins only) exposes `GET /health` and `POST /render`. `/render` accepts either raw HTML (`text/plain`) or a JSON envelope `{html, format?, landscape?, scale?}`, writes the HTML to a temp file, shells out to a headless Chromium binary (`CHROME_PATH`) with `--headless=new --no-sandbox --disable-dev-shm-usage --print-to-pdf`, runs a *light generic* sanity gate (PDF created + size above a floor + ≥1 page — no app-specific audit), and returns `application/pdf` bytes or a `4xx/5xx` JSON `{error}`. A shared-secret header (`x-render-token` vs env `RENDER_SHARED_SECRET`) guards the endpoint; a body-size cap rejects oversized payloads. The worker ships with its own `package.json`, a `Dockerfile` (node:20-slim + Debian chromium + the 4 NODDO brand fonts), a `railway.json` (Dockerfile builder + `/health` healthcheck), a `README.md`, and a `node:test` smoke/contract test. Modeled verbatim on the proven peptides `render-worker/plan-render-server.mjs` pattern, stripped of all plan-specific logic.

**Tech Stack:** Node 20 (ESM, builtins only: `node:http`, `node:fs`, `node:os`, `node:path`, `node:child_process`, `node:test`, `node:assert`), headless Chromium (Debian `chromium` package in the image; local Chrome/Edge via `CHROME_PATH` on Windows), Docker (`node:20-slim`), Railway (DOCKERFILE builder). No application framework, no third-party npm packages.

## Global Constraints

- **App-agnostic / generic:** the worker contains ZERO NODDO/cotización specifics. No content audit beyond the generic sanity gate. It renders any self-contained HTML to PDF. (Spec §C1, DG-3 "generic reusable html→pdf".)
- **Chromium flags are mandatory on Linux/root-in-container:** `--no-sandbox --disable-dev-shm-usage --headless=new`. Without them the render crashes on the Railway worker. Harmless on Windows Chrome/Edge. (Spec §C1.)
- **Light sanity gate ONLY:** PDF file created + size above a byte floor (catches blank/stripped renders) + ≥1 `/Type /Page` object. No em-dash / footer / app-string checks (those were peptides-specific). (Spec §C1.)
- **Auth:** every `/render` request must carry `x-render-token` equal to `process.env.RENDER_SHARED_SECRET`; mismatch or missing → `401`. If `RENDER_SHARED_SECRET` is unset the server refuses to start (fail-closed). `/health` is unauthenticated. CORS off (server-to-server only). (Spec §C1, §5.)
- **Body size cap:** reject bodies over `MAX_BODY` (8 MiB) with `413`. (Spec §C1.)
- **Brand fonts installed in the image:** Cormorant Garamond / Syne / Inter / DM Mono, so the worker can render them even if HTML omits them. The app WILL embed fonts as base64, but install them anyway for safety. Source the exact `.ttf` files already in the repo at `src/lib/cotizador/fonts/`. (Spec §C1.)
- **Branch & commits:** all work on a branch off `dev` (never `main`). Per `WORKFLOW.md`, conventional-commit prefixes only (`feat: / fix: / chore: / docs: / refactor: / test:`). Suggested branch: `feat/cotizador-render-worker` (or fold into a shared `fix/cotizador-render-worker` feature branch if the owner prefers). The current working branch is `fix/remediation-m1`; create the worker branch off `dev`.
- **Deploy is OUT of these code tasks:** the Railway `railway up` / domain step is a separate owner-run action (Railway API token or a documented go-live note). The code tasks below stop at "buildable + smoke-tested locally". (Spec §6 "Railway access for deploy".)
- **No `git add .` / `git add -A`:** commit only the worker's own files by explicit path (repo hygiene rule for parallel work). Every file in this plan lives under `render-worker/`, so staging is always `git add render-worker/<file>`.

---

## Branch & governance

All work on a single feature branch off `dev` (never `main`):

```bash
git checkout dev
git pull origin dev
git checkout -b feat/cotizador-render-worker
```

Verify gate **before every commit** (run from `render-worker/`):

```bash
node --check server.mjs && node --test
```

`node --test` runs the smoke test added in Task 1 (it requires a local Chrome/Edge — see Task 1 for the `CHROME_PATH` setup on Windows). Conventional commit prefixes only. Stage only worker files by explicit path: `git add render-worker/<file>`. Push to `origin feat/cotizador-render-worker`; never push `main`.

---

### Task 1: Smoke/contract test + fixture (failing first)

Stand up the worker's own test harness before the server exists. The smoke test boots the (not-yet-written) `server.mjs` as a child process, waits for `/health`, POSTs a tiny known HTML fixture to `/render` with the shared-secret header, and asserts a non-empty `application/pdf` comes back. Written first so it fails, proving the contract is what drives the implementation.

This test needs a real local Chromium. On Windows that is Edge or Chrome; the test sets `CHROME_PATH` for the child process. On the worker's Linux image Chromium comes from the Dockerfile.

**Files:**
- Create: `render-worker/package.json`
- Create: `render-worker/test/fixture.html`
- Create: `render-worker/test/smoke.mjs`

**Interfaces:**
- Consumes: `server.mjs` (Task 2) — booted as `node server.mjs`, env `PORT`, `RENDER_SHARED_SECRET`, `CHROME_PATH`; exposes `GET /health` → `200 "ok"` and `POST /render` (header `x-render-token`) → `application/pdf` bytes.
- Produces: nothing for later tasks (terminal verification artifact).

- [ ] **Step 1 — Create the worker's `package.json`** (its own, ESM, no deps beyond Node builtins; Chromium comes from the image, not npm).

Create `render-worker/package.json`:

```json
{
  "name": "noddo-render-worker",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Generic, app-agnostic HTML->PDF render worker (headless Chromium). Deployed to Railway. Zero runtime dependencies.",
  "main": "server.mjs",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "start": "node server.mjs",
    "check": "node --check server.mjs",
    "test": "node --test"
  }
}
```

- [ ] **Step 2 — Create the fixture HTML** (a tiny, fully self-contained document; intentionally large enough background to clear the size floor).

Create `render-worker/test/fixture.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>NODDO render worker smoke fixture</title>
  <style>
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      width: 210mm;
      min-height: 297mm;
      background: #0f2417;
      color: #f4efe6;
      font-family: Inter, Arial, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      box-sizing: border-box;
      padding: 24mm;
    }
    h1 { font-size: 48px; margin: 0 0 16px; }
    p { font-size: 16px; line-height: 1.5; max-width: 60ch; }
    .swatch { height: 60mm; margin-top: 24px; background: linear-gradient(135deg, #c9a96a, #0f2417); border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Render worker smoke test</h1>
  <p>If this paragraph and the colored panel below appear in the output PDF, the headless Chromium pipeline rendered backgrounds and text correctly. This fixture is intentionally heavy on solid color so the PDF clears the size floor.</p>
  <div class="swatch"></div>
</body>
</html>
```

- [ ] **Step 3 — Write the failing smoke test.**

Create `render-worker/test/smoke.mjs`:

```js
// Smoke/contract test for the generic HTML->PDF render worker.
//
// Boots server.mjs as a child process on an ephemeral port, waits for /health,
// then POSTs the known fixture HTML to /render with the shared secret and asserts
// a non-empty application/pdf comes back. Also asserts the auth gate (missing/wrong
// token -> 401) and the JSON envelope path.
//
// REQUIRES A LOCAL CHROMIUM. Set CHROME_PATH before running:
//   Windows (Edge):  $env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
//   Windows (Chrome):$env:CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"
//   Linux:           CHROME_PATH=/usr/bin/chromium
// If CHROME_PATH is unset the test falls back to the same Windows Edge/Chrome
// probing that server.mjs uses.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER = join(HERE, "..", "server.mjs");
const FIXTURE = readFileSync(join(HERE, "fixture.html"), "utf8");

const PORT = 4173; // fixed test port; ephemeral enough for local runs
const TOKEN = "smoke-secret-token";
const BASE = `http://127.0.0.1:${PORT}`;

function startServer() {
  const child = spawn(process.execPath, [SERVER], {
    env: {
      ...process.env,
      PORT: String(PORT),
      RENDER_SHARED_SECRET: TOKEN,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stderr.on("data", (d) => process.stderr.write(`[worker] ${d}`));
  return child;
}

async function waitForHealth(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/health`);
      if (r.ok && (await r.text()) === "ok") return;
    } catch {
      /* not up yet */
    }
    await new Promise((res) => setTimeout(res, 200));
  }
  throw new Error("worker /health did not come up in time");
}

test("worker smoke/contract", async (t) => {
  const child = startServer();
  t.after(() => child.kill());
  await waitForHealth();

  await t.test("GET /health returns ok", async () => {
    const r = await fetch(`${BASE}/health`);
    assert.equal(r.status, 200);
    assert.equal(await r.text(), "ok");
  });

  await t.test("POST /render without token is 401", async () => {
    const r = await fetch(`${BASE}/render`, {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: FIXTURE,
    });
    assert.equal(r.status, 401);
  });

  await t.test("POST /render with wrong token is 401", async () => {
    const r = await fetch(`${BASE}/render`, {
      method: "POST",
      headers: { "content-type": "text/plain", "x-render-token": "nope" },
      body: FIXTURE,
    });
    assert.equal(r.status, 401);
  });

  await t.test("POST /render (text/plain) returns non-empty PDF", async () => {
    const r = await fetch(`${BASE}/render`, {
      method: "POST",
      headers: { "content-type": "text/plain", "x-render-token": TOKEN },
      body: FIXTURE,
    });
    assert.equal(r.status, 200, `expected 200, got ${r.status}: ${await r.clone().text().catch(() => "")}`);
    assert.equal(r.headers.get("content-type"), "application/pdf");
    const buf = Buffer.from(await r.arrayBuffer());
    assert.ok(buf.length > 1000, `PDF too small: ${buf.length} bytes`);
    assert.equal(buf.subarray(0, 5).toString("latin1"), "%PDF-", "missing %PDF- magic header");
  });

  await t.test("POST /render (json envelope) returns non-empty PDF", async () => {
    const r = await fetch(`${BASE}/render`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-render-token": TOKEN },
      body: JSON.stringify({ html: FIXTURE, format: "A4", landscape: false }),
    });
    assert.equal(r.status, 200, `expected 200, got ${r.status}`);
    assert.equal(r.headers.get("content-type"), "application/pdf");
    const buf = Buffer.from(await r.arrayBuffer());
    assert.ok(buf.length > 1000, `PDF too small: ${buf.length} bytes`);
  });
});
```

- [ ] **Step 4 — Run the test to verify it FAILS (server does not exist yet).**

First set `CHROME_PATH` for this shell (Windows / PowerShell — adjust to whichever browser is installed):

```powershell
$env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
```

Then from `render-worker/`:

```bash
node --test
```

Expected: FAIL — the child process cannot start (`Cannot find module .../server.mjs`), so `waitForHealth` throws "worker /health did not come up in time" and every subtest fails.

- [ ] **Step 5 — Commit the test harness.**

```bash
git add render-worker/package.json render-worker/test/fixture.html render-worker/test/smoke.mjs
git commit -m "test: add render worker smoke/contract test and fixture"
```

---

### Task 2: The render worker server (`server.mjs`)

Implement the full HTTP server that makes Task 1's smoke test pass. Plain `node:http`, ESM, no deps. Reads `PORT`, `CHROME_PATH`, `RENDER_SHARED_SECRET`. Renders via headless Chromium `--print-to-pdf`. Generic light sanity gate. Shared-secret auth. Body cap. Modeled on peptides `plan-render-server.mjs`, with all plan-specific audit/assets logic removed and auth + JSON-options added.

**Files:**
- Create: `render-worker/server.mjs`

**Interfaces:**
- Consumes: Node builtins only; env `PORT` (default 4042), `CHROME_PATH`, `RENDER_SHARED_SECRET` (required).
- Produces (the contract Task 1 and the NODDO app depend on):
  - `GET /health` → `200` body `"ok"` (unauthenticated).
  - `POST /render`, header `x-render-token: <RENDER_SHARED_SECRET>`, body either raw HTML (`Content-Type: text/plain`) or JSON `{ html: string, format?: "A4"|"Letter", landscape?: boolean, scale?: number }` (`Content-Type: application/json`). Success → `200` `Content-Type: application/pdf` with PDF bytes. Auth fail → `401` `{error}`. Body too large → `413`. Bad input / render-gate fail → `400` `{error, fails?}`. Unexpected → `500` `{error}`.

- [ ] **Step 1 — Write the full server.**

Create `render-worker/server.mjs`:

```js
// Generic HTML->PDF render worker (HTTP). Headless Chromium lives HERE, not on Vercel.
// App-agnostic: it renders ANY self-contained HTML to PDF. No NODDO/cotizacion
// specifics, no content audit beyond a light generic sanity gate. Modeled on the
// proven peptides plan-render worker, stripped of plan-specific logic, plus
// shared-secret auth and JSON render options.
//
//   GET  /health   -> 200 "ok"  (unauthenticated)
//   POST /render   -> body = HTML (text/plain) OR {html, format?, landscape?, scale?} (json)
//                     header x-render-token MUST equal RENDER_SHARED_SECRET
//                     -> 200 application/pdf  | 400/401/413/500 application/json {error}
//
// Env:
//   PORT                  default 4042 (Railway injects PORT)
//   CHROME_PATH           path to the Chromium/Chrome/Edge binary (set to chromium on Linux)
//   RENDER_SHARED_SECRET  REQUIRED shared secret; server refuses to start without it
import http from "node:http";
import { mkdtempSync, writeFileSync, readFileSync, statSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const PORT = Number(process.env.PORT || 4042);
const MAX_BODY = 8 * 1024 * 1024; // 8 MiB body cap
const MIN_PDF_BYTES = 1024; // size floor: below this the render almost certainly failed/stripped
const SHARED_SECRET = process.env.RENDER_SHARED_SECRET;

if (!SHARED_SECRET) {
  console.error("FATAL: RENDER_SHARED_SECRET is not set. Refusing to start an open PDF endpoint.");
  process.exit(1);
}

// Resolve a Chromium binary. On Linux/Railway set CHROME_PATH=/usr/bin/chromium.
// On Windows fall back to Edge then Chrome so local dev + the smoke test work.
let CHROME = process.env.CHROME_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
if (!existsSync(CHROME) && existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")) {
  CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
}

const ALLOWED_FORMATS = new Set(["A4", "Letter"]);

// Build the Chromium argv for the requested options. --print-to-pdf renders the
// page to PDF. --no-sandbox + --disable-dev-shm-usage are REQUIRED when Chromium
// runs as root in a container (Railway/Linux); harmless for Edge/Chrome on Windows.
function chromeArgs({ pdfPath, profileDir, uri, format, landscape, scale }) {
  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--no-first-run",
    "--no-pdf-header-footer",
    `--user-data-dir=${profileDir}`,
  ];
  if (landscape) args.push("--landscape");
  if (ALLOWED_FORMATS.has(format)) args.push(`--print-to-pdf-paper-size=${format}`);
  if (typeof scale === "number" && scale > 0 && scale <= 2) args.push(`--force-device-scale-factor=${scale}`);
  args.push(`--print-to-pdf=${pdfPath}`, uri);
  return args;
}

// Render one self-contained HTML string to PDF bytes. Returns {ok:true, pdf, kb, pages}
// or {ok:false, fails:[...]} after a LIGHT generic sanity gate (no app-specific audit).
function renderHtmlToPdf(html, opts) {
  const work = mkdtempSync(join(tmpdir(), "noddo-render-"));
  try {
    const htmlPath = join(work, "page.html");
    writeFileSync(htmlPath, html);
    const pdfPath = join(work, "page.pdf");
    const profileDir = join(work, "profile");
    const uri = "file:///" + htmlPath.replace(/\\/g, "/").replace(/ /g, "%20");
    try {
      execFileSync(CHROME, chromeArgs({ pdfPath, profileDir, uri, ...opts }), {
        stdio: "ignore",
        timeout: 60000,
      });
    } catch {
      /* Chrome may exit non-zero yet still write the PDF; the sanity gate is the real check. */
    }
    // Brief settle so the file finishes flushing before we stat/read it.
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);

    const fails = [];
    if (!existsSync(pdfPath)) {
      fails.push("PDF was not created");
      return { ok: false, fails };
    }
    const bytes = statSync(pdfPath).size;
    const kb = Math.round(bytes / 1024);
    if (bytes < MIN_PDF_BYTES) fails.push(`PDF is ${bytes} bytes (< ${MIN_PDF_BYTES}) — render likely blank/stripped`);
    const raw = readFileSync(pdfPath, "latin1");
    const pages = (raw.match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
    if (pages < 1) fails.push("PDF has no pages");

    if (fails.length) return { ok: false, fails };
    return { ok: true, pdf: readFileSync(pdfPath), kb, pages };
  } finally {
    try { rmSync(work, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

// Constant-time-ish token compare (length-guarded equality). The secret is short
// and server-to-server, so a simple guarded compare is sufficient here.
function tokenOk(req) {
  const got = req.headers["x-render-token"];
  return typeof got === "string" && got.length > 0 && got === SHARED_SECRET;
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }

  if (req.method === "POST" && req.url === "/render") {
    if (!tokenOk(req)) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }
    let body = "";
    let aborted = false;
    req.on("data", (c) => {
      body += c;
      if (body.length > MAX_BODY) {
        aborted = true;
        res.writeHead(413, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: "payload too large" }));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (aborted) return;
      try {
        const isJson = (req.headers["content-type"] || "").includes("json");
        let html = body;
        let opts = {};
        if (isJson) {
          const parsed = JSON.parse(body);
          html = parsed.html;
          opts = {
            format: parsed.format,
            landscape: Boolean(parsed.landscape),
            scale: typeof parsed.scale === "number" ? parsed.scale : undefined,
          };
        }
        if (typeof html !== "string" || html.trim().length === 0) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "missing or empty html" }));
          return;
        }
        const r = renderHtmlToPdf(html, opts);
        if (!r.ok) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "render_failed", fails: r.fails }));
          return;
        }
        res.writeHead(200, { "content-type": "application/pdf", "content-length": r.pdf.length });
        res.end(r.pdf);
      } catch (e) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end(JSON.stringify({ error: String(e?.message || e) }));
      }
    });
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not found" }));
});

server.listen(PORT, () => console.log(`noddo render worker on :${PORT} (chrome: ${CHROME})`));
```

- [ ] **Step 2 — Syntax-check the server.**

From `render-worker/`:

```bash
node --check server.mjs
```

Expected: exit 0, no output (valid ESM).

- [ ] **Step 3 — Run the smoke test to verify it PASSES.**

Ensure `CHROME_PATH` is still set (Task 1 Step 4). From `render-worker/`:

```bash
node --test
```

Expected: PASS — all subtests green: `GET /health returns ok`, both `401` cases, and both `POST /render` cases return a `%PDF-` buffer over 1000 bytes. Summary line like `# pass 6  # fail 0`.

- [ ] **Step 4 — Commit the server.**

```bash
git add render-worker/server.mjs
git commit -m "feat: add generic HTML->PDF render worker server"
```

---

### Task 3: Dockerfile (node:20-slim + chromium + 4 NODDO brand fonts)

The deploy image. `node:20-slim` + Debian `chromium` + the 4 brand fonts so the worker renders Cormorant/Syne/Inter/DM Mono even when the HTML omits them. The brand `.ttf` files already exist in the repo at `src/lib/cotizador/fonts/`; copy them into `render-worker/fonts/` (so the Docker build context is self-contained — Docker cannot `COPY` from outside the `render-worker/` context) and install them into the image's font dir.

Non-testable artifact → verification is `node --check` of the already-tested server plus a real `docker build` if Docker is available, otherwise a documented manual gate.

**Files:**
- Create: `render-worker/fonts/cormorant-light.ttf` (copied from `src/lib/cotizador/fonts/cormorant-light.ttf`)
- Create: `render-worker/fonts/syne-bold.ttf` (copied from `src/lib/cotizador/fonts/syne-bold.ttf`)
- Create: `render-worker/fonts/inter-regular.ttf` (copied from `src/lib/cotizador/fonts/inter-regular.ttf`)
- Create: `render-worker/fonts/dm-mono-regular.ttf` (copied from `src/lib/cotizador/fonts/dm-mono-regular.ttf`)
- Create: `render-worker/Dockerfile`
- Create: `render-worker/.dockerignore`

**Interfaces:**
- Consumes: `server.mjs` (Task 2), `package.json` (Task 1), `fonts/*.ttf` (this task).
- Produces: a runnable container image whose `CMD` is `node server.mjs` and whose `CHROME_PATH` defaults to `/usr/bin/chromium`.

- [ ] **Step 1 — Copy the 4 brand `.ttf` files into the worker's build context.**

From the repo root (`C:/dev/NODDO-SALES`):

```bash
mkdir -p render-worker/fonts
cp src/lib/cotizador/fonts/cormorant-light.ttf render-worker/fonts/cormorant-light.ttf
cp src/lib/cotizador/fonts/syne-bold.ttf       render-worker/fonts/syne-bold.ttf
cp src/lib/cotizador/fonts/inter-regular.ttf   render-worker/fonts/inter-regular.ttf
cp src/lib/cotizador/fonts/dm-mono-regular.ttf render-worker/fonts/dm-mono-regular.ttf
```

Verify all four landed:

```bash
ls -la render-worker/fonts
```

Expected: four `.ttf` files, each non-zero size.

- [ ] **Step 2 — Create `.dockerignore`** so the build context stays small and the test dir/node-junk never ships.

Create `render-worker/.dockerignore`:

```
test/
README.md
*.log
.DS_Store
node_modules/
```

- [ ] **Step 3 — Write the Dockerfile.**

Create `render-worker/Dockerfile`:

```dockerfile
# Generic HTML->PDF render worker (headless Chromium). Deploys to Railway.
# Zero npm dependencies (Node built-ins only); the image just needs a Chromium
# binary + the NODDO brand fonts. Build context = this render-worker/ dir.
FROM node:20-slim

# Chromium + base font packages + CA certs. fontconfig lets the freshly-installed
# brand fonts be discovered by Chromium at render time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install the 4 NODDO brand fonts so the worker can render them even if the
# incoming HTML does not embed them (the app embeds them as base64; this is a
# safety net). Cormorant Garamond / Syne / Inter / DM Mono.
COPY fonts/ /usr/share/fonts/truetype/noddo/
RUN fc-cache -f

# The worker reads CHROME_PATH; point it at the Debian chromium binary.
ENV CHROME_PATH=/usr/bin/chromium

WORKDIR /app
COPY package.json ./package.json
COPY server.mjs ./server.mjs

# Railway injects PORT; the worker falls back to 4042 locally.
EXPOSE 4042
CMD ["node", "server.mjs"]
```

- [ ] **Step 4 — Verify (real build if Docker is available; manual gate otherwise).**

If Docker is installed, from `render-worker/`:

```bash
docker build -t noddo-render-worker:smoke .
```

Expected: build succeeds; final line `Successfully tagged noddo-render-worker:smoke` (or `naming to docker.io/library/noddo-render-worker:smoke done` on buildkit). Then optionally run it locally to confirm `/health`:

```bash
docker run --rm -e RENDER_SHARED_SECRET=smoke-secret-token -p 4042:4042 noddo-render-worker:smoke
# in another shell:
curl -s http://127.0.0.1:4042/health    # expect: ok
```

If Docker is NOT available in this environment, the gate is instead:
1. `node --check render-worker/server.mjs` → exit 0 (already proven in Task 2).
2. Confirm the Dockerfile references only files that exist in the context: `server.mjs`, `package.json`, `fonts/` — verify with `ls render-worker` showing all three, and `ls render-worker/fonts` showing the 4 `.ttf` files.

Record which gate was used in the commit body.

- [ ] **Step 5 — Commit the Dockerfile and fonts.**

```bash
git add render-worker/Dockerfile render-worker/.dockerignore render-worker/fonts/cormorant-light.ttf render-worker/fonts/syne-bold.ttf render-worker/fonts/inter-regular.ttf render-worker/fonts/dm-mono-regular.ttf
git commit -m "feat: add render worker Dockerfile with chromium and NODDO brand fonts"
```

---

### Task 4: railway.json (DOCKERFILE builder + /health healthcheck)

Railway deploy descriptor. DOCKERFILE builder, `/health` healthcheck, restart-on-failure. Non-testable → verify with a JSON-parse check.

**Files:**
- Create: `render-worker/railway.json`

**Interfaces:**
- Consumes: `Dockerfile` (Task 3), the worker's `GET /health` route (Task 2).
- Produces: the Railway service config (builder + healthcheck).

- [ ] **Step 1 — Write `railway.json`.**

Create `render-worker/railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- [ ] **Step 2 — Verify it is valid JSON.**

From `render-worker/`:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('railway.json','utf8')); console.log('railway.json OK')"
```

Expected: `railway.json OK` (any parse error → exit 1 with a SyntaxError).

- [ ] **Step 3 — Commit.**

```bash
git add render-worker/railway.json
git commit -m "feat: add railway.json for render worker deploy"
```

---

### Task 5: README (env vars, local run, smoke test, Railway deploy + go-live note)

Operator-facing docs: env vars, how to run locally (incl. the Windows `CHROME_PATH`), how to run the smoke test, and the Railway deploy steps marked as an owner-run go-live (OUT of the code tasks). Non-testable → verify by re-reading and confirming every command/path matches the actual files.

**Files:**
- Create: `render-worker/README.md`

**Interfaces:**
- Consumes: all prior files (documents them). Produces: nothing executable.

- [ ] **Step 1 — Write the README.**

Create `render-worker/README.md`:

````markdown
# NODDO render worker (generic HTML→PDF)

A generic, app-agnostic HTML→PDF service. It renders ANY fully self-contained HTML
to a PDF with headless Chromium and returns the bytes. It contains **no NODDO /
cotización specifics** — the calling app sends complete HTML (inline CSS, base64
fonts/images) and gets PDF bytes back. Lives off Vercel (no Chromium there) and
deploys to Railway.

- `GET  /health` → `200 "ok"` (unauthenticated)
- `POST /render` → body = HTML (`text/plain`) **or** `{html, format?, landscape?, scale?}` (`application/json`); header `x-render-token` required → `application/pdf`

## Files

- `server.mjs` — the HTTP worker (ESM, zero deps, Node builtins only)
- `package.json` — worker manifest (`type: module`, `start` / `check` / `test` scripts)
- `fonts/` — the 4 NODDO brand fonts baked into the image (Cormorant / Syne / Inter / DM Mono)
- `Dockerfile` — `node:20-slim` + Debian `chromium` + brand fonts
- `.dockerignore` — keeps `test/` and docs out of the image
- `railway.json` — DOCKERFILE builder + `/health` healthcheck
- `test/smoke.mjs` + `test/fixture.html` — local smoke/contract test (`node --test`)

## Environment variables

| Var | Required | Default | Purpose |
| --- | --- | --- | --- |
| `RENDER_SHARED_SECRET` | **yes** | — | Shared secret. Every `/render` request must send it as the `x-render-token` header. The server **refuses to start** if unset. |
| `CHROME_PATH` | on Linux | Windows Edge→Chrome probe | Path to the Chromium/Chrome/Edge binary. The Docker image sets `/usr/bin/chromium`. |
| `PORT` | no | `4042` | Listen port. Railway injects this automatically. |

The PDF render flags `--no-sandbox --disable-dev-shm-usage --headless=new` are
**mandatory** when Chromium runs as root in a container (Railway/Linux) and are
applied unconditionally by the worker.

## Run locally (Windows)

Point `CHROME_PATH` at an installed browser, set a secret, and start:

```powershell
$env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
# or: $env:CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"
$env:RENDER_SHARED_SECRET = "dev-secret"
node server.mjs
```

Health check, then a render:

```powershell
curl http://127.0.0.1:4042/health           # -> ok
curl -X POST http://127.0.0.1:4042/render `
  -H "content-type: text/plain" `
  -H "x-render-token: dev-secret" `
  --data-binary "@test/fixture.html" `
  --output out.pdf                           # -> writes out.pdf
```

## Smoke / contract test

The test boots the server, waits for `/health`, and asserts a non-empty
`application/pdf` comes back for both the `text/plain` and JSON paths, plus the
`401` auth gate. It needs a local Chromium, so set `CHROME_PATH` first:

```powershell
$env:CHROME_PATH = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
node --test
```

Expected: all subtests pass (`# pass 6  # fail 0`). On Linux use
`CHROME_PATH=/usr/bin/chromium node --test`.

## Build the image locally

```bash
docker build -t noddo-render-worker .
docker run --rm -e RENDER_SHARED_SECRET=dev-secret -p 4042:4042 noddo-render-worker
```

## Deploy to Railway — GO-LIVE (owner-run, separate from code changes)

> **This is a deploy step, not a code task.** Building and testing the worker
> needs no Railway access; only the live deploy does. The owner runs this (or
> provides a `RAILWAY_API_TOKEN` so it can be run for them). Until
> `COTIZADOR_RENDER_URL` is set in the NODDO Vercel project, the app's quote-PDF
> path stays on its current behavior — deploying the worker is safe and
> independent.

```powershell
$env:RAILWAY_API_TOKEN = "<owner-provided Railway API token>"
railway link                                  # link this dir to the Railway project
railway up --detach                           # build remotely + deploy this Dockerfile
railway variables --set RENDER_SHARED_SECRET=<a-strong-random-secret>
railway domain                                # mint a public URL
```

Then in the **NODDO** Vercel project (prod + preview) set:

- `COTIZADOR_RENDER_URL = https://<the-railway-domain>`
- `RENDER_SHARED_SECRET = <the same strong secret>`

and redeploy. The app sends `x-render-token: $RENDER_SHARED_SECRET` on every
`POST /render`. Rotate the secret by updating both sides.
````

- [ ] **Step 2 — Verify the README is internally consistent.**

Re-read `render-worker/README.md` and confirm: (a) every filename in the "Files" table exists under `render-worker/` (`server.mjs`, `package.json`, `fonts/`, `Dockerfile`, `.dockerignore`, `railway.json`, `test/smoke.mjs`, `test/fixture.html`); (b) the env-var names match `server.mjs` exactly (`RENDER_SHARED_SECRET`, `CHROME_PATH`, `PORT`); (c) the `x-render-token` header name matches `server.mjs`. Run:

```bash
ls render-worker render-worker/fonts render-worker/test
```

Expected: the listing shows all files referenced in the README.

- [ ] **Step 3 — Commit.**

```bash
git add render-worker/README.md
git commit -m "docs: add render worker README with env, local run, and Railway go-live"
```

---

## Task dependency / order

```
Task 1 (smoke test + fixture + package.json)   ──┐  must come first (RED: fails, defines the contract)
Task 2 (server.mjs)                              ─┘→ makes Task 1 pass (GREEN)
        │
        ├─▶ Task 3 (Dockerfile + fonts)   depends on server.mjs + package.json existing
        │        │
        │        └─▶ Task 4 (railway.json)   references the Dockerfile (logical dep; parse-only verify)
        │
        └─▶ Task 5 (README)   documents tasks 1–4; do last so it matches the final files
```

- **Strict order:** Task 1 → Task 2 (TDD red→green). Tasks 3, 4, 5 each depend on Tasks 1–2 being done.
- Tasks 3 and 4 are logically sequential (railway.json points at the Dockerfile) but have no code coupling; 4 can be done immediately after 3.
- Task 5 (README) goes last so its file list and commands describe the real, final tree.
- The Railway deploy / go-live is **not a task** — it is the owner-run step documented in Task 5's README.

## Per-task effort estimate

| Task | Deliverable | Effort |
| --- | --- | --- |
| 1 | Smoke test + fixture + worker `package.json` (RED) | ~30 min |
| 2 | `server.mjs` (GREEN, makes Task 1 pass) | ~40 min |
| 3 | Dockerfile + copy 4 brand fonts + `.dockerignore` (+ optional `docker build`) | ~30 min (≈+10 min if a real `docker build` runs) |
| 4 | `railway.json` + JSON-parse verify | ~10 min |
| 5 | README (env, local run, smoke, Railway go-live) | ~25 min |

**Total: ≈ 2.0–2.5 hours** of focused work (lower end if Docker isn't built locally; upper end if a real `docker build` + container `/health` smoke is performed). Pure scaffolding/render-plumbing with no business logic, so risk is low; the main external dependency is a working local Chrome/Edge for the Task 1/2 smoke test.
