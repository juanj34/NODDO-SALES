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
