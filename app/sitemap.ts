import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";
import { buildSitemapUrls } from "@/lib/sitemap";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site, posts } = await getContent();
  return buildSitemapUrls(site.url, posts, new Date());
}
