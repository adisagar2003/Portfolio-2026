import { describe, it, expect } from "vitest";
import { extractHeadings, activeHeadingId } from "./toc";

describe("activeHeadingId", () => {
  const pos = [
    { id: "a", top: 0 },
    { id: "b", top: 500 },
    { id: "c", top: 1000 },
  ];

  it("returns the first heading at the top", () => {
    expect(activeHeadingId(pos, 0)).toBe("a");
  });
  it("returns the section currently scrolled into", () => {
    expect(activeHeadingId(pos, 600)).toBe("b");
    expect(activeHeadingId(pos, 1200)).toBe("c");
  });
  it("returns null when there are no headings", () => {
    expect(activeHeadingId([], 100)).toBeNull();
  });
});

describe("extractHeadings", () => {
  it("collects h2 and h3 with slugified ids", () => {
    const md = "# Title\n\n## First Section\n\ntext\n\n### A Detail\n";
    expect(extractHeadings(md)).toEqual([
      { level: 2, text: "First Section", id: "first-section" },
      { level: 3, text: "A Detail", id: "a-detail" },
    ]);
  });

  it("ignores h1 and headings inside code fences", () => {
    const md = "# Top\n\n```\n## not a heading\n```\n\n## Real\n";
    expect(extractHeadings(md)).toEqual([
      { level: 2, text: "Real", id: "real" },
    ]);
  });

  it("strips trailing closing hashes", () => {
    expect(extractHeadings("## Heading ##")).toEqual([
      { level: 2, text: "Heading", id: "heading" },
    ]);
  });

  it("returns empty for no headings", () => {
    expect(extractHeadings("just a paragraph")).toEqual([]);
  });

  it("dedupes ids when heading text repeats", () => {
    const md = "## Setup\n\n## Setup\n\n## Setup\n";
    expect(extractHeadings(md).map((h) => h.id)).toEqual([
      "setup",
      "setup-2",
      "setup-3",
    ]);
  });
});
