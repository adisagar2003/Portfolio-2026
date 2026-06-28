import { postTimestamp, metaDescription, type DatedPost } from "./posts";

interface SiteInput {
  siteUrl: string;
  siteName: string;
  authorName: string;
  role?: string;
  socials?: { href: string }[];
}

/**
 * Build schema.org JSON-LD for the homepage: a WebSite plus the author Person
 * (with social profiles as sameAs). Pure + tested.
 */
export function buildSiteJsonLd({
  siteUrl,
  siteName,
  authorName,
  role,
  socials = [],
}: SiteInput): Record<string, unknown> {
  const base = siteUrl.replace(/\/+$/, "");
  const sameAs = socials.map((s) => s.href).filter(Boolean);
  const person: Record<string, unknown> = {
    "@type": "Person",
    name: authorName,
    url: base,
  };
  if (role) person.jobTitle = role;
  if (sameAs.length) person.sameAs = sameAs;

  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: siteName, url: base },
      person,
    ],
  };
}

interface ArticleInput {
  post: DatedPost & {
    slug: string;
    title: string;
    excerpt?: string;
    body?: string;
    coverUrl?: string;
  };
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  authorName: string;
}

/**
 * Build schema.org BlogPosting JSON-LD for an article. Pure + tested so the
 * shape stays stable; rendered into a <script type="application/ld+json">.
 */
export function buildArticleJsonLd({
  post,
  siteUrl,
  siteName,
  siteDescription,
  authorName,
}: ArticleInput): Record<string, unknown> {
  const base = siteUrl.replace(/\/+$/, "");
  const url = `${base}/writing/${post.slug}`;
  const ts = postTimestamp(post);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: metaDescription(post, siteDescription),
    url,
    mainEntityOfPage: url,
    author: { "@type": "Person", name: authorName },
    publisher: { "@type": "Person", name: siteName || authorName },
  };
  if (ts > 0) data.datePublished = new Date(ts).toISOString();
  if (post.coverUrl) data.image = post.coverUrl;
  return data;
}
