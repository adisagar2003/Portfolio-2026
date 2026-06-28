/** Strip any trailing slashes from a base URL. */
export function siteBase(siteUrl: string): string {
  return siteUrl.replace(/\/+$/, "");
}

/** Canonical absolute URL for a post: <base>/writing/<slug>. */
export function postUrl(siteUrl: string, slug: string): string {
  return `${siteBase(siteUrl)}/writing/${slug}`;
}
