import { describe, it, expect } from "vitest";
import fs from "node:fs";

// Inventory sync guard: "Publicar disponibilidad" must refresh ALL inventory
// entities the public availability table renders — not just `unidades`.
// Otherwise a unit assigned a tipología that didn't exist in the last full
// publish (or a multi-tipo link / complemento change) resolves to "—" on the
// microsite even after publishing availability, because the snapshot still
// carries the stale `tipologias` / `unidad_tipologias` / `complementos` arrays.
describe("publicar-disponibilidad snapshot inventory sync", () => {
  const src = fs.readFileSync(new URL("../route.ts", import.meta.url), "utf8");

  it("re-fetches every inventory entity from the DB, not only unidades", () => {
    expect(src).toMatch(/from\(\s*["']unidades["']\s*\)/);
    expect(src).toMatch(/from\(\s*["']tipologias["']\s*\)/);
    expect(src).toMatch(/from\(\s*["']unidad_tipologias["']\s*\)/);
    expect(src).toMatch(/from\(\s*["']complementos["']\s*\)/);
  });

  it("writes all refreshed inventory arrays into the updated snapshot", () => {
    expect(src).toMatch(/unidades:\s*currentUnidades/);
    expect(src).toMatch(/tipologias:\s*currentTipologias/);
    expect(src).toMatch(/unidad_tipologias:\s*currentUnidadTipologias/);
    expect(src).toMatch(/complementos:\s*currentComplementos/);
  });
});
