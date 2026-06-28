import { postTimestamp, metaDescription, type DatedPost } from "./posts";

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface RssPost extends DatedPost {
  slug: string;
  title: string;
  excerpt?: string;
  body?: string;
}

interface RssInput {
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  posts: RssPost[];
}

/** Build a valid RSS 2.0 document for the blog. Pure + tested. */
export function buildRssXml({
  siteUrl,
  siteName,
  siteDescription,
  posts,
}: RssInput): string {
  const base = siteUrl.replace(/\/+$/, "");
  const items = posts
    .map((p) => {
      const link = `${base}/writing/${p.slug}`;
      const ts = postTimestamp(p);
      const pubDate = ts > 0 ? new Date(ts).toUTCString() : "";
      const desc = metaDescription(p, siteDescription);
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        `      <description>${escapeXml(desc)}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(base)}</link>
    <description>${escapeXml(siteDescription)}</description>
${items}
  </channel>
</rss>`;
}
