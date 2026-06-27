import { describe, it, expect } from "vitest";
import fs from "node:fs";

// P0-10 guard: restoring a version replaces live child data + the project row, so it
// MUST bust the 1h microsite cache or the public site keeps serving the old snapshot.
describe("restaurar version cache revalidation", () => {
  const src = fs.readFileSync(new URL("../route.ts", import.meta.url), "utf8");

  it("imports the revalidateProyecto helper", () => {
    expect(src).toMatch(
      /import\s*\{\s*revalidateProyecto\s*\}\s*from\s*["']@\/lib\/supabase\/cached-queries["']/
    );
  });

  it("revalidates slug and subdomain after the restore", () => {
    expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.slug\s*\)/);
    expect(src).toMatch(/revalidateProyecto\(\s*proyecto\.subdomain\s*\)/);
  });
});
