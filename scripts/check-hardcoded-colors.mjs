// Static gate: fails when a hardcoded color bypasses the theme tokens.
// Scans src/**/*.{tsx,ts,css} except globals.css (which legitimately defines raw colors).
// Suppress a genuinely theme-independent line with a trailing `// theme-allow: <reason>`.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { pathToFileURL } from "node:url";

const PATTERNS = [
  // Tailwind color utilities that don't go through a token
  /\b(?:text|bg|border|divide|ring|from|via|to|fill|stroke|shadow|outline|ring-offset)-(?:white|black)(?:\/\d{1,3})?\b/g,
  // Literal hex whites/blacks and the known dark surface hexes
  /#(?:fff|ffffff|000|000000)\b/gi,
  /#(?:141414|1a1a1a|0a0a0a|222222|2a2a2a|333333)\b/gi,
  // Literal rgba whites/blacks (use rgba(var(--contrast-rgb)/--overlay-rgb) instead)
  /rgba\(\s*255\s*,\s*255\s*,\s*255/gi,
  /rgba\(\s*0\s*,\s*0\s*,\s*0/gi,
];

export function findHardcodedColors(line, file) {
  if (/\/\/\s*theme-allow/.test(line)) return [];
  const hits = [];
  for (const re of PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(line))) hits.push({ token: m[0], file });
  }
  return hits;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

export function scan(root = "src") {
  const exts = new Set([".tsx", ".ts", ".css"]);
  const findings = [];
  for (const file of walk(root)) {
    if (!exts.has(extname(file))) continue;
    const norm = file.replace(/\\/g, "/");
    if (norm.endsWith("src/app/globals.css")) continue; // defines raw colors by design
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const hit of findHardcodedColors(line, file)) {
        findings.push(`${norm}:${i + 1}  ${hit.token}`);
      }
    });
  }
  return findings;
}

function main() {
  const root = process.argv[2] || "src";
  const findings = scan(root);
  if (findings.length) {
    console.error(`\n✖ ${findings.length} hardcoded color(s) found:\n` + findings.join("\n"));
    process.exit(1);
  }
  console.log("✓ no hardcoded colors");
}

// Run only when invoked directly (not when imported by tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
