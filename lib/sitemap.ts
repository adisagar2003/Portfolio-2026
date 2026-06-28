import { postTimestamp, type DatedPost } from "./posts";
import { siteBase, postUrl } from "./url";

export interface SitemapUrl {
  url: string;
  lastModified: Date;
}

interface PostLike extends DatedPost {
  slug: string;
}

/**
 * Build sitemap entries: the home page plus every post's /writing/<slug> URL,
 * with lastModified derived from the post's publish timestamp. Pure + tested.
 */
export function buildSitemapUrls(
  siteUrl: string,
  posts: PostLike[],
  now: Date = new Date(0),
): SitemapUrl[] {
  const base = siteBase(siteUrl);
  const home: SitemapUrl = { url: base || "/", lastModified: now };
  const postUrls = posts.map((p) => {
    const ts = postTimestamp(p);
    return {
      url: postUrl(siteUrl, p.slug),
      lastModified: ts > 0 ? new Date(ts) : now,
    };
  });
  return [home, ...postUrls];
}
