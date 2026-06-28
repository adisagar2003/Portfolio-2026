import { describe, it, expect } from "vitest";
import {
  slugify,
  readTime,
  buildMeta,
  autoExcerpt,
  isExternalHref,
} from "./post-utils";

describe("isExternalHref", () => {
  it("treats absolute http(s) URLs as external", () => {
    expect(isExternalHref("https://example.com")).toBe(true);
    expect(isExternalHref("http://example.com/x")).toBe(true);
  });
  it("treats internal/anchor/mailto links as not external", () => {
    expect(isExternalHref("/writing/post")).toBe(false);
    expect(isExternalHref("#top")).toBe(false);
    expect(isExternalHref("mailto:a@b.com")).toBe(false);
  });
});

describe("slugify", () => {
  it("makes a URL-safe slug from a title with spaces and capitals", () => {
    expect(slugify("Understanding LLM agent architecture for groundwork-ai")).toBe(
      "understanding-llm-agent-architecture-for-groundwork-ai",
    );
  });

  it("strips punctuation and collapses separators", () => {
    expect(slugify("Hello,  World!! -- again")).toBe("hello-world-again");
  });

  it("never contains spaces or uppercase", () => {
    const s = slugify("A Mixed CASE Title 123");
    expect(s).not.toMatch(/[A-Z\s]/);
  });
});

describe("readTime", () => {
  it("is at least 1 minute", () => {
    expect(readTime("")).toBe(1);
    expect(readTime("one two three")).toBe(1);
  });

  it("scales with word count (~200 wpm)", () => {
    const words = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readTime(words)).toBe(3);
  });
});

describe("buildMeta", () => {
  it("combines date and read time", () => {
    expect(buildMeta("Jun 24, 2026", "a b c")).toBe("Jun 24, 2026 · 1 min read");
  });
});

describe("autoExcerpt", () => {
  it("strips markdown and truncates", () => {
    const md = "# Title\n\nSome **bold** intro text that explains the post.";
    const ex = autoExcerpt(md, 30);
    expect(ex.length).toBeLessThanOrEqual(31);
    expect(ex).not.toContain("#");
    expect(ex).not.toContain("**");
  });
});
