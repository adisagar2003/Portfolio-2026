import Link from "next/link";
import type { Post } from "@/lib/types";
import { displayDateFor } from "@/lib/posts";
import { ArrowUpRight } from "@/components/icons";

export default function Writing({
  posts,
}: {
  posts: Post[];
}) {
  return (
    <>
      <div id="writing" className="writing" data-reveal>
        <div className="section-label">
          <span className="section-label-index">01</span>
          <span className="section-label-text">Writing</span>
          <span className="section-label-line" />
        </div>

        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/writing/${post.slug}`}
            className="post-btn"
          >
            <span className="post-date">{displayDateFor(post) || post.date}</span>
            <span>
              <span className="post-title">{post.title}</span>
              <span className="post-excerpt">{post.excerpt}</span>
            </span>
            <span className="post-arrow">
              <ArrowUpRight />
            </span>
          </Link>
        ))}

        <p className="writing-note">
          Written in markdown via the /admin editor.
        </p>
      </div>
    </>
  );
}
