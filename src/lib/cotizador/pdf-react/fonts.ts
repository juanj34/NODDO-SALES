/**
 * Font registration for @react-pdf/renderer
 *
 * Registers the 4 NODDO brand fonts:
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

  const fontsDir = path.join(process.cwd(), "src", "lib", "cotizador", "fonts");

  const fonts = [
    { file: "cormorant-light.ttf", family: FONT_FAMILY.HEADING, weight: 300 as const },
    { file: "syne-bold.ttf", family: FONT_FAMILY.LABEL, weight: 700 as const },
    { file: "inter-regular.ttf", family: FONT_FAMILY.BODY, weight: 400 as const },
    { file: "dm-mono-regular.ttf", family: FONT_FAMILY.MONO, weight: 400 as const },
  ];

  for (const { file, family, weight } of fonts) {
    const filePath = path.join(fontsDir, file);
    if (fs.existsSync(filePath)) {
      Font.register({
        family,
        fonts: [{ src: filePath, fontWeight: weight }],
      });
    }
  }

  // Disable hyphenation (looks bad in PDFs)
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}
