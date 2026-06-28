import { describe, it, expect } from "vitest";
import { lintPostBody } from "./lint";

describe("lintPostBody", () => {
  it("returns no warnings for clean content", () => {
    expect(
      lintPostBody("## Section\n\n![a cat](cat.png)\n\n[home](/)"),
    ).toEqual([]);
  });

  it("flags images missing alt text", () => {
    const w = lintPostBody("![](cat.png)");
    expect(w.some((m) => /alt text/.test(m))).toBe(true);
  });

  it("flags placeholder link URLs", () => {
    const w = lintPostBody("see [docs](https://)");
    expect(w.some((m) => /placeholder/.test(m))).toBe(true);
  });

  it("flags empty link text but not empty-alt images as links", () => {
    const w = lintPostBody("[](/somewhere)");
    expect(w.some((m) => /no text/.test(m))).toBe(true);
  });

  it("flags a top-level H1 in the body", () => {
    const w = lintPostBody("# Big Heading\n\ntext");
    expect(w.some((m) => /H1/.test(m))).toBe(true);
  });

  it("does not flag ## or H1 inside a code fence", () => {
    expect(lintPostBody("## Section\n\ntext")).toEqual([]);
    expect(lintPostBody("```\n# not a heading\n```")).toEqual([]);
  });

  it("pluralizes counts", () => {
    const w = lintPostBody("![](a.png)\n![](b.png)");
    expect(w[0]).toMatch(/2 images are missing/);
  });
});
