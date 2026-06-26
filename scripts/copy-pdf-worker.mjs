// Cross-platform replacement for the old Unix-only `cp … || true` postinstall.
// Copies the pdf.js worker into /public so react-pdf can load it at /pdf.worker.min.mjs.
// Non-fatal: a missing source (e.g. partial install) must NOT fail `npm install`.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

const src = "node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
const dest = "public/pdf.worker.min.mjs";

try {
  if (existsSync(src)) {
    mkdirSync("public", { recursive: true });
    copyFileSync(src, dest);
    console.log("[postinstall] copied pdf worker -> " + dest);
  } else {
    console.warn("[postinstall] pdf worker source not found (skipped): " + src);
  }
} catch (err) {
  console.warn("[postinstall] could not copy pdf worker (non-fatal): " + err.message);
}
