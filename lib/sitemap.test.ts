import { describe, it, expect } from "vitest";
import { buildSitemapUrls } from "./sitemap";

describe("buildSitemapUrls", () => {
  const now = new Date("2026-01-01T00:00:00Z");

  it("includes the home page first, then each post", () => {
    const urls = buildSitemapUrls(
      "https://site.com",
      [{ slug: "a", date: "Jun 24, 2026" }],
      now,
    );
    expect(urls[0].url).toBe("https://site.com");
    expect(urls[1].url).toBe("https://site.com/writing/a");
  });

  it("strips a trailing slash from the site URL", () => {
    const urls = buildSitemapUrls("https://site.com/", [], now);
    expect(urls[0].url).toBe("https://site.com");
  });

  it("uses the post's publish date as lastModified", () => {
    const urls = buildSitemapUrls(
      "https://site.com",
      [{ slug: "a", date: "Jun 24, 2026" }],
      now,
    );
    expect(urls[1].lastModified.getTime()).toBe(Date.parse("Jun 24, 2026"));
  });

  it("falls back to now when a post has no parseable date", () => {
    const urls = buildSitemapUrls(
      "https://site.com",
      [{ slug: "a" }],
      now,
    );
    expect(urls[1].lastModified.getTime()).toBe(now.getTime());
  });
});
