import { describe, it, expect } from "vitest";
import { buildRssXml, escapeXml } from "./rss";

describe("escapeXml", () => {
  it("escapes the five XML entities", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });
});

describe("buildRssXml", () => {
  const input = {
    siteUrl: "https://site.com/",
    siteName: "My Site",
    siteDescription: "desc",
    posts: [
      { slug: "a", title: "First & Best", excerpt: "Hi", date: "Jun 24, 2026" },
    ],
  };

  it("produces a valid RSS shell with channel metadata", () => {
    const xml = buildRssXml(input);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<rss version=\"2.0\">");
    expect(xml).toContain("<title>My Site</title>");
    expect(xml).toContain("<link>https://site.com</link>");
  });

  it("renders an escaped item with a permalink and pubDate", () => {
    const xml = buildRssXml(input);
    expect(xml).toContain("<title>First &amp; Best</title>");
    expect(xml).toContain("<link>https://site.com/writing/a</link>");
    expect(xml).toContain(new Date(Date.parse("Jun 24, 2026")).toUTCString());
    expect(xml).toContain("<description>Hi</description>");
  });

  it("falls back to the site description when a post has no excerpt", () => {
    const xml = buildRssXml({
      ...input,
      posts: [{ slug: "b", title: "T", body: "" }],
    });
    expect(xml).toContain("<description>desc</description>");
  });
});
