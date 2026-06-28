import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Markdown from "@/components/Markdown";
import { getPost, getContent } from "@/lib/content";
import {
  metaDescription,
  adjacentPosts,
  displayDateFor,
  isoDate,
} from "@/lib/posts";
import { readTime } from "@/lib/post-utils";
import { extractHeadings } from "@/lib/toc";
import { buildArticleJsonLd } from "@/lib/jsonld";
import ReadingProgress from "@/components/ReadingProgress";
import { ArrowLeft } from "@/components/icons";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const { posts } = await getContent();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const { site } = await getContent();
  const description = metaDescription(post, site.description);

  return {
    metadataBase: new URL(site.url),
    title: `${post.title} — ${site.title}`,
    description,
    alternates: { canonical: `/writing/${post.slug}` },
    openGraph: {
      title: post.title,
      description,
      url: `${site.url}/writing/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { profile, site, posts } = await getContent();
  const { newer, older } = adjacentPosts(posts, slug);
  const jsonLd = buildArticleJsonLd({
    post,
    siteUrl: site.url,
    siteName: site.title,
    siteDescription: site.description,
    authorName: profile.name,
  });

  return (
    <div className="root" id="top">
      <ReadingProgress />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article>
        <nav className="article-nav">
          <div className="article-nav-inner">
            <Link href="/" className="article-back">
              <ArrowLeft size={16} />
              Back
            </Link>
            <span className="article-logo metal">{profile.initials}</span>
          </div>
        </nav>

        <div className="article">
          {post.coverUrl ? (
            <div className="article-cover-wrap">
              <Image
                className="article-cover"
                src={post.coverUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 680px) 100vw, 680px"
              />
            </div>
          ) : null}
          <div className="article-meta">
            {displayDateFor(post) ? (
              <>
                <time dateTime={isoDate(post) || undefined}>
                  {displayDateFor(post)}
                </time>
                {" · "}
              </>
            ) : null}
            {readTime(post.body)} min read
          </div>
          <h1 className="article-title">{post.title}</h1>
          {(() => {
            const toc = extractHeadings(post.body);
            return toc.length >= 3 ? (
              <nav className="article-toc" aria-label="Table of contents">
                <div className="article-toc-label">On this page</div>
                <ul>
                  {toc.map((h) => (
                    <li
                      key={h.id}
                      className={h.level === 3 ? "article-toc-sub" : undefined}
                    >
                      <a href={`#${h.id}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null;
          })()}
          <div className="article-md">
            <Markdown body={post.body} />
          </div>

          {(newer || older) && (
            <nav className="article-more">
              {older ? (
                <Link href={`/writing/${older.slug}`} className="article-more-link">
                  <span className="article-more-dir">← Older</span>
                  <span className="article-more-title">{older.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {newer ? (
                <Link
                  href={`/writing/${newer.slug}`}
                  className="article-more-link article-more-next"
                >
                  <span className="article-more-dir">Newer →</span>
                  <span className="article-more-title">{newer.title}</span>
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </article>
    </div>
  );
}