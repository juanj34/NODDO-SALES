import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const ROUTES = [
  "cotizaciones/route.ts",
  "cotizaciones/preview/route.ts",
  "cotizaciones/[id]/regenerate/route.ts",
  "unidades/export-pdf/route.ts",
  "upload/route.ts",
];

describe("heavy PDF/image routes declare extended maxDuration", () => {
  for (const rel of ROUTES) {
    it(`${rel} sets maxDuration`, () => {
      const src = fs.readFileSync(
        path.join(process.cwd(), "src/app/api", rel),
        "utf8"
      );
      expect(src).toMatch(/export const maxDuration\s*=\s*60/);
    });
  }

  it("vercel.json functions glob targets App Router, not pages/api", () => {
    const vercel = fs.readFileSync(
      path.join(process.cwd(), "vercel.json"),
      "utf8"
    );
    expect(vercel).toContain("src/app/api/**/*.ts");
    expect(vercel).not.toContain("pages/api/**/*.ts");
  });
});
