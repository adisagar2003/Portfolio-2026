import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getContent();
  const base = site.url.replace(/\/+$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/login"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
