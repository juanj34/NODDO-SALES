/**
 * Font registration for @react-pdf/renderer
 *
 * Registers the 4 NODDO brand fonts using the same path strategy as
 * the jsPDF pdf-fonts.ts (__dirname-relative, works on Vercel).
 *
 *   - Cormorant Garamond Light (300) → headings
 *   - Syne Bold (700)               → labels, UPPERCASE
 *   - Inter Regular (400)           → body text
 *   - DM Mono Regular (400)         → prices, data
 */

import { Font } from "@react-pdf/renderer";
import * as fs from "fs";
import * as path from "path";

export const FONT_FAMILY = {
  HEADING: "Cormorant",
  LABEL: "Syne",
  BODY: "Inter",
  MONO: "DMMono",
} as const;

let registered = false;

export function registerFonts(): void {
  if (registered) return;

  // Use __dirname (same strategy as pdf-fonts.ts — works on Vercel)
  // The fonts directory is a sibling of the cotizador lib files
  const fontsDir = path.join(__dirname, "..", "fonts");
  // Fallback: try process.cwd() for local dev with tsx
  const fontsDirAlt = path.join(process.cwd(), "src", "lib", "cotizador", "fonts");

  const dir = fs.existsSync(fontsDir) ? fontsDir : fontsDirAlt;

  const fonts = [
    { file: "cormorant-light.ttf", family: FONT_FAMILY.HEADING, weight: 300 as const },
    { file: "syne-bold.ttf", family: FONT_FAMILY.LABEL, weight: 700 as const },
    { file: "inter-regular.ttf", family: FONT_FAMILY.BODY, weight: 400 as const },
    { file: "dm-mono-regular.ttf", family: FONT_FAMILY.MONO, weight: 400 as const },
  ];

  for (const { file, family, weight } of fonts) {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
      // Read as buffer and create data URI — most reliable across all environments
      const buffer = fs.readFileSync(filePath);
      const dataUri = `data:font/truetype;base64,${buffer.toString("base64")}`;
      Font.register({
        family,
        fonts: [{ src: dataUri, fontWeight: weight }],
      });
    } else {
      console.warn(`[react-pdf] font not found: ${filePath}`);
    }
  }

  // Disable hyphenation (looks bad in PDFs)
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
