import { describe, it, expect } from "vitest";
import { resolveTheme } from "./theme";

describe("resolveTheme", () => {
  it("honors an explicit saved theme", () => {
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("dark")).toBe("dark");
  });
  it("defaults to dark when unset or invalid", () => {
    expect(resolveTheme(null)).toBe("dark");
    expect(resolveTheme(undefined)).toBe("dark");
    expect(resolveTheme("purple")).toBe("dark");
  });
});
