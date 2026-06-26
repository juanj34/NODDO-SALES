import { describe, it, expect } from "vitest";
// @ts-expect-error — plain .mjs script, no type declarations
import { findHardcodedColors } from "../check-hardcoded-colors.mjs";

describe("findHardcodedColors", () => {
  it("flags hardcoded Tailwind color utilities", () => {
    const hits = findHardcodedColors('<div className="text-white bg-black/60" />', "a.tsx");
    expect(hits.map((h: { token: string }) => h.token)).toEqual(
      expect.arrayContaining(["text-white", "bg-black/60"])
    );
  });

  it("flags literal hex and rgba in tsx", () => {
    expect(findHardcodedColors('style={{ color: "#141414" }}', "a.tsx").length).toBeGreaterThan(0);
    expect(findHardcodedColors('background: "rgba(255,255,255,0.1)"', "a.tsx").length).toBeGreaterThan(0);
    expect(findHardcodedColors('color: "#ffffff"', "a.tsx").length).toBeGreaterThan(0);
  });

  it("does not flag token usages", () => {
    expect(
      findHardcodedColors('className="text-[var(--text-primary)] bg-[var(--surface-2)]"', "a.tsx")
    ).toEqual([]);
    expect(
      findHardcodedColors('background: "rgba(var(--overlay-rgb), 0.6)"', "a.tsx")
    ).toEqual([]);
  });

  it("respects // theme-allow", () => {
    expect(
      findHardcodedColors('<div className="bg-black/80" /> // theme-allow: photo scrim', "a.tsx")
    ).toEqual([]);
  });
});
