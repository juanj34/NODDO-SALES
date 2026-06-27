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
