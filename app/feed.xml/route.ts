import { getContent } from "@/lib/content";
import { buildRssXml } from "@/lib/rss";

export const revalidate = 3600;

export async function GET() {
  const { site, posts } = await getContent();
  const xml = buildRssXml({
    siteUrl: site.url,
    siteName: site.title,
    siteDescription: site.description,
    posts,
  });
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
