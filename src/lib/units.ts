import type { UnitOfMeasurement, AreaConversionResult } from "@/types";

/**
 * Unit of measurement configuration
 */
export const UNIT_CONFIG: Record<
  UnitOfMeasurement,
  {
    symbol: string;
    name: string;
    namePlural: string;
  }
> = {
  m2: {
    symbol: "m²",
    name: "Metro cuadrado",
    namePlural: "Metros cuadrados",
  },
  sqft: {
    symbol: "sqft",
    name: "Square foot",
    namePlural: "Square feet",
  },
};

/**
 * Conversion factors
 * 1 m² = 10.764 sqft (standard international conversion)
 */
export const M2_TO_SQFT = 10.764;
export const SQFT_TO_M2 = 1 / M2_TO_SQFT;

/**
 * Convert area between units
 *
 * @example
 * convertArea(100, "m2", "sqft") // { value: 1076.4, fromUnit: "m2", toUnit: "sqft", ... }
 * convertArea(1076.4, "sqft", "m2") // { value: 100, fromUnit: "sqft", toUnit: "m2", ... }
 */
export function convertArea(
  value: number,
  fromUnit: UnitOfMeasurement,
  toUnit: UnitOfMeasurement
): AreaConversionResult {
  // Same unit — no conversion needed
  if (fromUnit === toUnit) {
    return {
      value,
      fromUnit,
      toUnit,
      conversionFactor: 1,
    };
  }

  const conversionFactor = fromUnit === "m2" ? M2_TO_SQFT : SQFT_TO_M2;
  const convertedValue = value * conversionFactor;

  return {
    value: Math.round(convertedValue * 100) / 100, // 2 decimal places
    fromUnit,
    toUnit,
    conversionFactor,
  };
}

/**
 * Format area with proper unit symbol
 *
 * @example
 * formatArea(120, "m2") // "120 m²"
 * formatArea(1292.4, "sqft") // "1292 sqft"
 * formatArea(120.5, "m2", { decimalPlaces: 1 }) // "120.5 m²"
 */
export function formatArea(
  area: number,
  unit: UnitOfMeasurement,
  options?: {
    decimalPlaces?: number;
    includeSymbol?: boolean;
  }
): string {
  const decimalPlaces = options?.decimalPlaces ?? 0;
  const includeSymbol = options?.includeSymbol ?? true;

  const formattedNumber = area.toFixed(decimalPlaces);
  const symbol = UNIT_CONFIG[unit].symbol;

  return includeSymbol ? `${formattedNumber} ${symbol}` : formattedNumber;
}

/**
 * Format area with conversion info for tooltip
 *
 * Returns display string and tooltip showing original value if converted
 *
 * @example
 * // User viewing in sqft, but base is m²
 * formatAreaWithConversion(100, "sqft", "m2")
 * // { display: "1076 sqft", tooltip: "Original: 100 m²" }
 */
export function formatAreaWithConversion(
  area: number,
  displayUnit: UnitOfMeasurement,
  baseUnit: UnitOfMeasurement
): { display: string; tooltip: string } {
  // Convert if needed
  const displayValue =
    displayUnit === baseUnit ? area : convertArea(area, baseUnit, displayUnit).value;

  const display = formatArea(displayValue, displayUnit);

  // Generate tooltip showing original value if converted
  const tooltip =
    displayUnit !== baseUnit ? `Original: ${formatArea(area, baseUnit)}` : "";

  return { display, tooltip };
}
