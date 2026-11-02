import { createCanvas } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";

const OUT = "C:/Users/juanj/noddo-cotizaciones-prueba";
const PNG = path.join(OUT, "png");
fs.mkdirSync(PNG, { recursive: true });

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

class NodeCanvasFactory {
  create(w, h) {
    const canvas = createCanvas(Math.ceil(w), Math.ceil(h));
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(cc, w, h) {
    cc.canvas.width = Math.ceil(w);
    cc.canvas.height = Math.ceil(h);
  }
  destroy(cc) {
    cc.canvas.width = 0;
    cc.canvas.height = 0;
  }
}

const SCALE = 2.0;
const files = fs.readdirSync(OUT).filter((f) => f.endsWith(".pdf")).sort();
for (const f of files) {
  const base = f.replace(/\.pdf$/, "");
  const data = new Uint8Array(fs.readFileSync(path.join(OUT, f)));
  const canvasFactory = new NodeCanvasFactory();
  const doc = await pdfjs.getDocument({
    data,
    canvasFactory,
    standardFontDataUrl: "C:/dev/NODDO-SALES/node_modules/pdfjs-dist/standard_fonts/",
    useSystemFonts: true,
  }).promise;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: SCALE });
    const cc = canvasFactory.create(viewport.width, viewport.height);
    await page.render({ canvasContext: cc.context, viewport, canvasFactory }).promise;
    fs.writeFileSync(
      path.join(PNG, `${base}-p${String(p).padStart(2, "0")}.png`),
      cc.canvas.toBuffer("image/png")
    );
    page.cleanup();
  }
  console.log(`${base}: ${doc.numPages} pages`);
  await doc.destroy();
}
console.log("PNG dir:", PNG);
