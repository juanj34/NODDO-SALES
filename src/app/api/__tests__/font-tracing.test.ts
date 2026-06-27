import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("serverless font tracing", () => {
  const cfg = fs.readFileSync(
    path.join(process.cwd(), "next.config.ts"),
    "utf8"
  );

  it("traces cotizador fonts into the availability-PDF route bundle", () => {
    expect(cfg).toMatch(/"\/api\/unidades\/export-pdf":\s*\[/);
  });

  it("the four font files exist on disk", () => {
    const dir = path.join(process.cwd(), "src/lib/cotizador/fonts");
    for (const f of [
      "cormorant-light.ttf",
      "syne-bold.ttf",
      "inter-regular.ttf",
      "dm-mono-regular.ttf",
    ]) {
      expect(fs.existsSync(path.join(dir, f))).toBe(true);
    }
  });
});
