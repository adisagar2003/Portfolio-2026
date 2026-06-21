"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Post } from "@/lib/types";
import { ArrowUpRight, ArrowLeft } from "@/components/icons";

export default function Writing({
  posts,
  initials,
}: {
  posts: Post[];
  initials: string;
}) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const openPost = posts.find((p) => p.slug === openSlug) ?? null;

  // scroll to top when opening, lock body scroll while the overlay is up,
  // and close on Escape
  useEffect(() => {
    if (!openPost) return;
    window.scrollTo(0, 0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSlug(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [openPost]);

  return (
    <>
      <div id="writing" className="writing" data-reveal>
        <div className="section-label">
          <span className="section-label-index">01</span>
          <span className="section-label-text">Writing</span>
          <span className="section-label-line" />
        </div>

        {posts.map((post) => (
          <button
            key={post.slug}
            type="button"
            className="post-btn"
            onClick={() => setOpenSlug(post.slug)}
          >
            <span className="post-date">{post.date}</span>
            <span>
              <span className="post-title">{post.title}</span>
              <span className="post-excerpt">{post.excerpt}</span>
            </span>
            <span className="post-arrow">
              <ArrowUpRight />
            </span>
          </button>
        ))}

        <p className="writing-note">
          Authored as MDX — drop a file in /content to add a post.
        </p>
      </div>

      {openPost && (
        <div className="article-overlay" role="dialog" aria-modal="true">
          <div className="article-nav">
            <div className="article-nav-inner">
              <button
                type="button"
                className="article-back"
                onClick={() => setOpenSlug(null)}
              >
                <ArrowLeft />
                Back
              </button>
              <span className="article-logo metal">{initials}</span>
            </div>
          </div>
          <article className="article">
            <div className="article-meta">{openPost.meta}</div>
            <h1 className="article-title">{openPost.title}</h1>
            <div className="article-md">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {openPost.body}
              </ReactMarkdown>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
