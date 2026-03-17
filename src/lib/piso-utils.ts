import type { Tipologia, TipologiaPiso } from "@/types";

/**
 * Resolve floor plans for a tipologia.
 * - If `pisos` is a non-empty array, return it sorted by `orden`.
 * - If `plano_url` exists, synthesize a single-floor array from legacy fields.
 * - Otherwise return empty array.
 */
export function resolvePisos(tipologia: Tipologia): TipologiaPiso[] {
  if (tipologia.pisos && tipologia.pisos.length > 0) {
    return [...tipologia.pisos].sort((a, b) => a.orden - b.orden);
  }
  if (tipologia.plano_url) {
    return [
      {
        id: "legacy-piso-0",
        nombre: "Plano",
        plano_url: tipologia.plano_url,
        hotspots: tipologia.hotspots ?? [],
        orden: 0,
      },
    ];
  }
  return [];
}
