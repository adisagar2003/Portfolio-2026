import { describe, it, expect } from "vitest";
import { leadingBlanks, contributionTotal } from "./contrib";

describe("leadingBlanks", () => {
  it("returns the UTC weekday index of the first date", () => {
    // 2025-06-22 is a Sunday (UTC) -> 0
    expect(leadingBlanks("2025-06-22")).toBe(0);
    // 2025-06-23 is a Monday -> 1
    expect(leadingBlanks("2025-06-23")).toBe(1);
    // 2025-06-27 is a Friday -> 5
    expect(leadingBlanks("2025-06-27")).toBe(5);
  });

  it("returns 0 for an unparseable date", () => {
    expect(leadingBlanks("nope")).toBe(0);
  });
});

describe("contributionTotal", () => {
  const days = [{ date: "x", count: 2 }, { date: "y", count: 3 }];

  it("prefers total.lastYear", () => {
    expect(contributionTotal({ lastYear: 100 }, days)).toBe(100);
  });

  it("falls back to the first value of the total object", () => {
    expect(contributionTotal({ "2025": 42 }, days)).toBe(42);
  });

  it("sums day counts when no total object is given", () => {
    expect(contributionTotal(undefined, days)).toBe(5);
  });
});
