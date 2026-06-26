import { describe, it, expect } from "vitest";
import fs from "node:fs";

// P0-10 guard: publishing availability MUST bust the 1h microsite cache, otherwise
// the public site can show sold/reserved units as available for up to an hour.
describe("publicar-disponibilidad cache revalidation", () => {
  const src = fs.readFileSync(new URL("../route.ts", import.meta.url), "utf8");

  it("imports the revalidateProyecto helper", () => {
    expect(src).toMatch(
      /import\s*\{\s*revalidateProyecto\s*\}\s*from\s*["']@\/lib\/supabase\/cached-queries["']/
    );
  });

  it("revalidates slug and subdomain after the snapshot update", () => {
    expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.slug\s*\)/);
    expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.subdomain\s*\)/);
  });
});
