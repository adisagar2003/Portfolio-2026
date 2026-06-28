import { describe, it, expect } from "vitest";
import { scrollProgress } from "./scroll";

describe("scrollProgress", () => {
  it("is 0 at the top and 1 at the bottom", () => {
    expect(scrollProgress(0, 2000, 1000)).toBe(0);
    expect(scrollProgress(1000, 2000, 1000)).toBe(1);
  });

  it("is 0.5 halfway", () => {
    expect(scrollProgress(500, 2000, 1000)).toBe(0.5);
  });

  it("returns 0 when content is not scrollable", () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
    expect(scrollProgress(0, 1000, 1000)).toBe(0);
  });

  it("clamps out-of-range scroll values", () => {
    expect(scrollProgress(-50, 2000, 1000)).toBe(0);
    expect(scrollProgress(99999, 2000, 1000)).toBe(1);
  });
});
