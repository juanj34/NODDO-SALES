/**
 * Largest-remainder (Hamilton) rounding: converts exact fractional percentages
 * into integers whose sum equals the rounded sum of the inputs — so a 70%
 * phase split into cuotas always displays percentages that add back to 70.
 */
export function roundPercentagesPreservingTotal(fractions: number[]): number[] {
  if (fractions.length === 0) return [];
  const target = Math.round(fractions.reduce((a, b) => a + b, 0));
  const floors = fractions.map(Math.floor);
  const out = [...floors];
  let deficit = target - floors.reduce((a, b) => a + b, 0);

  if (deficit >= 0) {
    // Hand out the missing units to the largest remainders first (stable on ties by index)
    const order = fractions
      .map((f, i) => ({ i, rem: f - Math.floor(f) }))
      .sort((a, b) => b.rem - a.rem || a.i - b.i);
    for (const { i } of order) {
      if (deficit <= 0) break;
      out[i] += 1;
      deficit -= 1;
    }
  } else {
    // Guard: floors overshot the target (possible only with pathological inputs,
    // e.g. negative or NaN fractions). Claw units back from the smallest
    // remainders first (stable on ties by index).
    let surplus = -deficit;
    const order = fractions
      .map((f, i) => ({ i, rem: f - Math.floor(f) }))
      .sort((a, b) => a.rem - b.rem || a.i - b.i);
    for (const { i } of order) {
      if (surplus <= 0) break;
      out[i] -= 1;
      surplus -= 1;
    }
  }

  return out;
}
