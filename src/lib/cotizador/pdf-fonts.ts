/**
 * NODDO Brand Font Registration for jsPDF
 *
 * Fonts:
 *   - cormorant (light 300)   → headings, project names, display text
 *   - syne (bold 700)         → section labels, UPPERCASE UI text
 *   - inter (regular 400)     → body text, descriptions
 *   - dm-mono (regular 400)   → prices, data values, reference numbers
 *
 * Usage:
 *   import { registerFonts, FONT } from "./pdf-fonts";
 *   registerFonts(doc);
 *   doc.setFont(FONT.HEADING, "normal");
 */

import jsPDF from "jspdf";
import * as fs from "fs";
import * as path from "path";

/** Font family constants for use with doc.setFont() */
export const FONT = {
  /** Cormorant Garamond Light — headings, project name, display text */
  HEADING: "cormorant",
  /** Syne Bold — section labels, UPPERCASE text, badges */
  LABEL: "syne",
  /** Inter Regular — body text, descriptions, paragraphs */
  BODY: "inter",
  /** DM Mono Regular — prices, data values, reference numbers */
  MONO: "dm-mono",
} as const;

// Cache loaded font base64 strings
let fontsCache: Map<string, string> | null = null;

function loadFonts(): Map<string, string> {
  if (fontsCache) return fontsCache;

  const fontsDir = path.join(__dirname, "fonts");
  const fontFiles = [
    { file: "cormorant-light.ttf", vfsName: "cormorant-light.ttf" },
    { file: "syne-bold.ttf", vfsName: "syne-bold.ttf" },
    { file: "inter-regular.ttf", vfsName: "inter-regular.ttf" },
    { file: "dm-mono-regular.ttf", vfsName: "dm-mono-regular.ttf" },
  ];

  const cache = new Map<string, string>();
  for (const { file, vfsName } of fontFiles) {
    const filePath = path.join(fontsDir, file);
    if (fs.existsSync(filePath)) {
      const buffer = fs.readFileSync(filePath);
      cache.set(vfsName, buffer.toString("base64"));
    }
  }

  fontsCache = cache;
  return cache;
}

/**
 * Register all NODDO brand fonts with a jsPDF document instance.
 * Call this once before any drawing operations.
 */
export function registerFonts(doc: jsPDF): void {
  const fonts = loadFonts();

  const registrations = [
    { vfsName: "cormorant-light.ttf", family: FONT.HEADING, style: "normal" },
    { vfsName: "syne-bold.ttf", family: FONT.LABEL, style: "bold" },
    { vfsName: "inter-regular.ttf", family: FONT.BODY, style: "normal" },
    { vfsName: "dm-mono-regular.ttf", family: FONT.MONO, style: "normal" },
  ];

  for (const { vfsName, family, style } of registrations) {
    const base64 = fonts.get(vfsName);
    if (base64) {
      doc.addFileToVFS(vfsName, base64);
      doc.addFont(vfsName, family, style);
    }
  }
}
