import { describe, it, expect } from "vitest";
import { buildArticleJsonLd } from "./jsonld";

const base = {
  siteUrl: "https://site.com/",
  siteName: "Site",
  siteDescription: "fallback desc",
  authorName: "Aditya",
};

describe("buildArticleJsonLd", () => {
  it("produces a BlogPosting with canonical url and author", () => {
    const d = buildArticleJsonLd({
      ...base,
      post: { slug: "a", title: "Hello", excerpt: "Hi there", date: "Jun 24, 2026" },
    });
    expect(d["@type"]).toBe("BlogPosting");
    expect(d.url).toBe("https://site.com/writing/a");
    expect(d.headline).toBe("Hello");
    expect((d.author as { name: string }).name).toBe("Aditya");
    expect(d.description).toBe("Hi there");
  });

  it("sets datePublished as ISO from the publish date", () => {
    const d = buildArticleJsonLd({
      ...base,
      post: { slug: "a", title: "T", date: "Jun 24, 2026" },
    });
    expect(d.datePublished).toBe(new Date(Date.parse("Jun 24, 2026")).toISOString());
  });

  it("omits datePublished and image when absent", () => {
    const d = buildArticleJsonLd({
      ...base,
      post: { slug: "a", title: "T", body: "" },
    });
    expect(d.datePublished).toBeUndefined();
    expect(d.image).toBeUndefined();
    expect(d.description).toBe("fallback desc");
  });

  it("includes the cover image when present", () => {
    const d = buildArticleJsonLd({
      ...base,
      post: { slug: "a", title: "T", coverUrl: "https://img/x.png", date: "Jun 1, 2026" },
    });
    expect(d.image).toBe("https://img/x.png");
  });
});
