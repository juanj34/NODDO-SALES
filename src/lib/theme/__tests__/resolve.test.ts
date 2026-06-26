import { describe, it, expect } from "vitest";
import { resolveTheme } from "../resolve";

describe("resolveTheme", () => {
  it("returns the cookie value when valid", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
  it("falls back to dark when cookie missing or invalid", () => {
    expect(resolveTheme(undefined)).toBe("dark");
    expect(resolveTheme(null)).toBe("dark");
    expect(resolveTheme("")).toBe("dark");
    expect(resolveTheme("banana")).toBe("dark");
  });
});
