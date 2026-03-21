/**
 * Returns the display name for a unit, with optional prefix.
 * e.g. "Casa 19" when prefix is "Casa", or just "19" when no prefix.
 */
export function getUnitDisplayName(
  unit: { identificador: string },
  prefix?: string | null
): string {
  return prefix ? `${prefix} ${unit.identificador}` : unit.identificador;
}
