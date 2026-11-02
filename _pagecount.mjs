import fs from "node:fs";
import path from "node:path";

const OUT = "C:/Users/juanj/noddo-cotizaciones-prueba";
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".pdf")).sort();
for (const f of files) {
  const data = new Uint8Array(fs.readFileSync(path.join(OUT, f)));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  console.log(`${f}\t${doc.numPages} pages`);
  await doc.destroy();
}
