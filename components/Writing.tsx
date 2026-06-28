import Link from "next/link";
import type { Post } from "@/lib/types";
import { displayDateFor, isoDate, listExcerpt } from "@/lib/posts";
import { readTime } from "@/lib/post-utils";
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
            <span className="post-date">
              <time dateTime={isoDate(post) || undefined}>
                {displayDateFor(post) || post.date}
              </time>
              <span className="post-readtime">{readTime(post.body)} min</span>
            </span>
            <span>
              <span className="post-title">{post.title}</span>
              <span className="post-excerpt">{listExcerpt(post)}</span>
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
