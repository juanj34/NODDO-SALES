#!/usr/bin/env node
/**
 * Browser console checker — captures all warnings/errors from a page.
 *
 * Usage:
 *   node scripts/console-check.mjs [url]
 *   node scripts/console-check.mjs http://localhost:3000/editor/abc123/dominio
 *   node scripts/console-check.mjs   # defaults to http://localhost:3000
 */

import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3000";
const WAIT_MS = parseInt(process.argv[3] || "5000", 10);

const COLORS = {
  error: "\x1b[31m",   // red
  warning: "\x1b[33m", // yellow
  info: "\x1b[36m",    // cyan
  log: "\x1b[90m",     // gray
  reset: "\x1b[0m",
};

console.log(`\n🔍 Checking console at: ${url}\n   Waiting ${WAIT_MS / 1000}s for page to settle...\n`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

const messages = [];
const networkErrors = [];

// Capture console messages
page.on("console", (msg) => {
  const type = msg.type(); // log, warning, error, info, debug
  const text = msg.text();
  // Skip noisy Next.js dev messages
  if (text.includes("Download the React DevTools") || text.includes("[HMR]") || text.includes("Fast Refresh")) return;
  messages.push({ type, text, url: msg.location()?.url || "" });
});

// Capture uncaught exceptions
page.on("pageerror", (err) => {
  messages.push({ type: "exception", text: err.message, url: err.stack?.split("\n")[1] || "" });
});

// Capture failed network requests
page.on("requestfailed", (req) => {
  const failure = req.failure();
  networkErrors.push({
    url: req.url(),
    method: req.method(),
    reason: failure?.errorText || "unknown",
  });
});

try {
  const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  const status = response?.status() || 0;

  if (status >= 400) {
    console.log(`${COLORS.error}⚠ Page returned HTTP ${status}${COLORS.reset}\n`);
  }

  // Wait a bit for any async errors to appear
  await page.waitForTimeout(WAIT_MS);
} catch (err) {
  console.log(`${COLORS.error}✖ Failed to load page: ${err.message}${COLORS.reset}\n`);
}

await browser.close();

// Print results
const errors = messages.filter((m) => m.type === "error" || m.type === "exception");
const warnings = messages.filter((m) => m.type === "warning");
const others = messages.filter((m) => m.type !== "error" && m.type !== "exception" && m.type !== "warning");

if (errors.length === 0 && warnings.length === 0 && networkErrors.length === 0) {
  console.log("✅ No errors or warnings found.\n");
} else {
  if (errors.length > 0) {
    console.log(`${COLORS.error}━━━ ERRORS (${errors.length}) ━━━${COLORS.reset}`);
    for (const m of errors) {
      const loc = m.url ? `  ${COLORS.log}${m.url}${COLORS.reset}` : "";
      console.log(`${COLORS.error}✖ [${m.type}]${COLORS.reset} ${m.text}${loc}`);
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`${COLORS.warning}━━━ WARNINGS (${warnings.length}) ━━━${COLORS.reset}`);
    for (const m of warnings) {
      const loc = m.url ? `  ${COLORS.log}${m.url}${COLORS.reset}` : "";
      console.log(`${COLORS.warning}⚠ [warning]${COLORS.reset} ${m.text}${loc}`);
    }
    console.log();
  }

  if (networkErrors.length > 0) {
    console.log(`${COLORS.error}━━━ NETWORK FAILURES (${networkErrors.length}) ━━━${COLORS.reset}`);
    for (const e of networkErrors) {
      console.log(`${COLORS.error}✖ ${e.method} ${e.url}${COLORS.reset} → ${e.reason}`);
    }
    console.log();
  }
}

if (others.length > 0) {
  console.log(`${COLORS.info}━━━ OTHER LOGS (${others.length}) ━━━${COLORS.reset}`);
  for (const m of others) {
    console.log(`${COLORS.log}  [${m.type}] ${m.text}${COLORS.reset}`);
  }
  console.log();
}

// Summary
const total = errors.length + warnings.length + networkErrors.length;
console.log(`📊 Summary: ${errors.length} errors, ${warnings.length} warnings, ${networkErrors.length} network failures\n`);
process.exit(total > 0 ? 1 : 0);
