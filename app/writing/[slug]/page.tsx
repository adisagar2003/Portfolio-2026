import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import { getPost, getContent } from "@/lib/content";
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

  return {
    metadataBase: new URL(site.url),
    title: `${post.title} — ${site.title}`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${site.url}/writing/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      images: post.coverUrl ? [{ url: post.coverUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function WritingPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const { profile } = await getContent();

  return (
    <div className="root" id="top">
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
            // eslint-disable-next-line @next/next/no-img-element
            <img className="article-cover" src={post.coverUrl} alt={post.title} />
          ) : null}
          <div className="article-meta">{post.meta}</div>
          <h1 className="article-title">{post.title}</h1>
          <div className="article-md">
            <Markdown body={post.body} />
          </div>
        </div>
      </article>
    </div>
  );
}