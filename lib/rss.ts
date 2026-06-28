import { postTimestamp, metaDescription, type DatedPost } from "./posts";
import { siteBase, postUrl } from "./url";

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
  const base = siteBase(siteUrl);
  const newest = posts.reduce((max, p) => Math.max(max, postTimestamp(p)), 0);
  const lastBuild = newest > 0 ? new Date(newest).toUTCString() : "";
  const items = posts
    .map((p) => {
      const link = postUrl(siteUrl, p.slug);
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
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(base)}</link>
    <atom:link href="${escapeXml(base)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>${lastBuild ? `\n    <lastBuildDate>${lastBuild}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>`;
}
