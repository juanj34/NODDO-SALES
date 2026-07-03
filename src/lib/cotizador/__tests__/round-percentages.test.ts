import { describe, it, expect } from "vitest";
import { roundPercentagesPreservingTotal } from "@/lib/cotizador/round-percentages";

describe("roundPercentagesPreservingTotal", () => {
  it("distributes the remainder to the largest fractional part (70% split 3 ways)", () => {
    expect(roundPercentagesPreservingTotal([23.333, 23.333, 23.334])).toEqual([23, 23, 24]);
  });

  it("passes a single exact value through unchanged", () => {
    expect(roundPercentagesPreservingTotal([70])).toEqual([70]);
  });

  it("sums to 100 when a resto phase is appended to a split initial phase", () => {
    const result = roundPercentagesPreservingTotal([23.333, 23.333, 23.334, 30]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("returns an empty array for empty input", () => {
    expect(roundPercentagesPreservingTotal([])).toEqual([]);
  });

  it("sums to 100 for equal thirds", () => {
    const result = roundPercentagesPreservingTotal([33.333, 33.333, 33.334]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("handles a multi-unit deficit / guard branch (three tied .6 remainders)", () => {
    // 23.6 * 3 = 70.8 -> rounds to 71; floors sum to 69 (deficit of 2, exercises
    // the same defensive branch that would fire on a negative deficit).
    const result = roundPercentagesPreservingTotal([23.6, 23.6, 23.6]);
    expect(result.reduce((a, b) => a + b, 0)).toBe(71);
  });
});
