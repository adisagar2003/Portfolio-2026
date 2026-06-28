"use client";

import { useMemo, useState } from "react";
import PostEditor, { type PostInitial } from "./PostEditor";

export interface PostRow extends PostInitial {
  slug: string;
  title: string;
  published: boolean;
}

type Filter = "all" | "published" | "drafts";

export default function PostList({
  posts,
  upsertPost,
  deletePost,
}: {
  posts: PostRow[];
  upsertPost: (fd: FormData) => void;
  deletePost: (fd: FormData) => void;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // template feeds the new-post editor; key remounts it when a template loads
  const [template, setTemplate] = useState<PostInitial | undefined>(undefined);
  const [tplKey, setTplKey] = useState(0);
  const [newOpen, setNewOpen] = useState(posts.length === 0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (filter === "published" && !p.published) return false;
      if (filter === "drafts" && p.published) return false;
      if (!needle) return true;
      return (
        p.title.toLowerCase().includes(needle) ||
        p.slug.toLowerCase().includes(needle) ||
        (p.excerpt ?? "").toLowerCase().includes(needle)
      );
    });
  }, [posts, q, filter]);

  function duplicate(p: PostRow) {
    setTemplate({
      ...p,
      slug: "",
      title: `${p.title} (copy)`,
      published: false,
      sort_order: 0,
    });
    setTplKey((k) => k + 1);
    setNewOpen(true);
    requestAnimationFrame(() =>
      document.getElementById("pe-new")?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  return (
    <>
      <div className="admin-posthead">
        <h2 className="admin-h2" style={{ margin: 0 }}>
          Writing posts
        </h2>
        <span className="admin-muted" style={{ margin: 0 }}>
          {filtered.length}/{posts.length}
        </span>
      </div>

      {/* search + filter */}
      <div className="pe-listbar">
        <input
          className="pe-input"
          placeholder="Search posts…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="pe-views">
          {(["all", "published", "drafts"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              className={"pe-view" + (filter === f ? " pe-view-on" : "")}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* New post — prominent, at the top */}
      <details id="pe-new" className="admin-subcard" open={newOpen}>
        <summary
          className="admin-summary"
          onClick={(e) => {
            e.preventDefault();
            setNewOpen((o) => !o);
          }}
        >
          ✍️ Write a new post{template ? " (from template)" : ""}
        </summary>
        <div style={{ marginTop: 14 }}>
          <PostEditor
            key={tplKey}
            action={upsertPost}
            initial={template}
            isNew
            takenSlugs={posts.map((p) => p.slug)}
          />
        </div>
      </details>

      {/* Existing posts */}
      {filtered.map((post) => (
        <details key={post.slug} className="admin-subcard">
          <summary className="admin-summary">
            {post.published ? "" : "🔒 "}
            {post.title || post.slug}{" "}
            <code style={{ fontWeight: 400 }}>/{post.slug}</code>
            <a
              href={`/writing/${post.slug}`}
              target="_blank"
              rel="noopener"
              className="admin-link"
              style={{ marginLeft: 8, fontWeight: 400 }}
            >
              View ↗
            </a>
          </summary>
          <div style={{ marginTop: 14 }}>
            <PostEditor
              action={upsertPost}
              initial={post}
              takenSlugs={posts
                .filter((p) => p.slug !== post.slug)
                .map((p) => p.slug)}
            />
            <div className="admin-actions" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="admin-btn"
                onClick={() => duplicate(post)}
              >
                Duplicate as template
              </button>
              <form action={deletePost} style={{ display: "inline" }}>
                <button
                  className="admin-btn admin-btn-danger"
                  type="submit"
                  name="slug"
                  value={post.slug}
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        </details>
      ))}
      {filtered.length === 0 && posts.length > 0 && (
        <p className="admin-muted" style={{ marginTop: 14 }}>
          No posts match “{q}”.
        </p>
      )}
    </>
  );
}
