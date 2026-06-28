import { describe, it, expect } from "vitest";
import { extractHeadings } from "./toc";

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
});
