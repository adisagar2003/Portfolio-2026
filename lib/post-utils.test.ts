import { describe, it, expect } from "vitest";
import {
  slugify,
  readTime,
  buildMeta,
  autoExcerpt,
  isExternalHref,
  flattenText,
  uniqueSlug,
  clampText,
} from "./post-utils";

describe("clampText", () => {
  it("leaves short text unchanged", () => {
    expect(clampText("hello world", 50)).toBe("hello world");
  });
  it("truncates at a word boundary with an ellipsis", () => {
    const out = clampText("the quick brown fox jumps", 12);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(13);
    expect(out).not.toContain("jum");
  });
  it("trims surrounding whitespace", () => {
    expect(clampText("   padded   ", 50)).toBe("padded");
  });
});

describe("flattenText", () => {
  it("returns plain strings as-is", () => {
    expect(flattenText("Hello")).toBe("Hello");
  });
  it("joins arrays of nodes", () => {
    expect(flattenText(["a", "b", "c"])).toBe("abc");
  });
  it("descends into elements via props.children", () => {
    expect(flattenText({ props: { children: "deep" } })).toBe("deep");
    expect(
      flattenText(["pre ", { props: { children: ["code", "!"] } }]),
    ).toBe("pre code!");
  });
  it("ignores null/booleans", () => {
    expect(flattenText(null)).toBe("");
    expect(flattenText(true)).toBe("");
  });
});

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

  it("transliterates accented characters instead of dropping them", () => {
    expect(slugify("Café Münchën")).toBe("cafe-munchen");
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
  });
});

describe("uniqueSlug", () => {
  it("returns the base when it is free", () => {
    expect(uniqueSlug("my-post", ["other"])).toBe("my-post");
  });
  it("appends -2 on first collision", () => {
    expect(uniqueSlug("my-post", ["my-post"])).toBe("my-post-2");
  });
  it("finds the next free numeric suffix", () => {
    expect(uniqueSlug("my-post", ["my-post", "my-post-2", "my-post-3"])).toBe(
      "my-post-4",
    );
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
