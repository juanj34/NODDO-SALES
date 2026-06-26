import * as fs from "fs";
import * as path from "path";

const FONT_FILES = [
  { file: "cormorant-light.ttf", family: "Cormorant", weight: 300 },
  { file: "syne-bold.ttf", family: "Syne", weight: 700 },
  { file: "inter-regular.ttf", family: "Inter", weight: 400 },
  { file: "dm-mono-regular.ttf", family: "DM Mono", weight: 400 },
] as const;

let cachedCss: string | null = null;

function resolveFontsDir(): string {
  // The fonts live at src/lib/cotizador/fonts/ — a sibling of the html/ dir's parent.
  const primary = path.join(__dirname, "..", "fonts");
  const alt = path.join(process.cwd(), "src", "lib", "cotizador", "fonts");
  return fs.existsSync(primary) ? primary : alt;
}

/**
 * Returns a <style>-ready CSS string with all 4 brand fonts inlined as
 * base64 data-URI @font-face rules. Cached after first read.
 * No external/relative font refs survive — the worker renders from a temp file.
 */
export function brandFontFaceCss(): string {
  if (cachedCss !== null) return cachedCss;
  const dir = resolveFontsDir();
  const rules: string[] = [];
  for (const { file, family, weight } of FONT_FILES) {
    const fp = path.join(dir, file);
    if (!fs.existsSync(fp)) {
      console.warn(`[cotizador/html] brand font not found: ${fp}`);
      continue;
    }
    const b64 = fs.readFileSync(fp).toString("base64");
    rules.push(
      `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;` +
        `font-display:swap;src:url(data:font/ttf;base64,${b64}) format('truetype');}`,
    );
  }
  cachedCss = rules.join("\n");
  return cachedCss;
}
