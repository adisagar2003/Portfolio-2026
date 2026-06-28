// Pure helpers for ordering and displaying posts by their publish date.
// Kept UTC-based so behaviour is deterministic everywhere (server, client, tests).

import { readTime, autoExcerpt } from "./post-utils";

export interface DatedPost {
  /** real publish timestamp (ISO) — the reliable sort key */
  createdAt?: string;
  /** optional human display date authored in the editor */
  date?: string;
}

/**
 * Best-effort publish timestamp. Prefers the authored display date (the date
 * the writer says it was published), falling back to the real createdAt
 * timestamp, then 0 — so ordering reflects intent but never breaks.
 */
export function postTimestamp(p: DatedPost): number {
  const fromDate = p.date ? Date.parse(p.date) : NaN;
  if (!Number.isNaN(fromDate)) return fromDate;
  const fromCreated = p.createdAt ? Date.parse(p.createdAt) : NaN;
  if (!Number.isNaN(fromCreated)) return fromCreated;
  return 0;
}

export interface PostSummary {
  slug: string;
  title: string;
  published: boolean;
  url: string;
  date: string;
}

/** Compact, API-friendly view of a post row (for GET /api/posts). */
export function postSummary(
  row: { slug: string; title?: string; published?: boolean } & DatedPost,
): PostSummary {
  return {
    slug: row.slug,
    title: row.title ?? "",
    published: row.published ?? false,
    url: `/writing/${row.slug}`,
    date: displayDateFor(row),
  };
}

/** The display date for a post: the authored date if parseable, else createdAt. */
export function displayDateFor(p: DatedPost): string {
  return formatPostDate(p.date ?? "") || formatPostDate(p.createdAt ?? "");
}

/** Machine-readable date "YYYY-MM-DD" (UTC) for <time datetime>, else "". */
export function isoDate(p: DatedPost): string {
  const ts = postTimestamp(p);
  return ts > 0 ? new Date(ts).toISOString().slice(0, 10) : "";
}

/**
 * Consistent article meta line: "<date> · <N> min read", derived live from the
 * post's date + body so it always matches the list and the current content
 * (rather than a possibly-stale stored string).
 */
export function articleMeta(p: DatedPost & { body?: string }): string {
  const date = displayDateFor(p);
  const mins = readTime(p.body ?? "");
  const read = `${mins} min read`;
  return date ? `${date} · ${read}` : read;
}

/**
 * SEO/social description for a post: the authored excerpt, else an auto-excerpt
 * from the body, else the site-wide fallback. Never empty (good for OG/Twitter).
 */
export function metaDescription(
  p: { excerpt?: string; body?: string },
  fallback = "",
): string {
  const ex = (p.excerpt ?? "").trim();
  if (ex) return ex;
  const auto = autoExcerpt(p.body ?? "");
  if (auto) return auto;
  return fallback;
}

/** Newest-first, without mutating the input. */
export function sortPostsByDateDesc<T extends DatedPost>(posts: T[]): T[] {
  return [...posts].sort((a, b) => postTimestamp(b) - postTimestamp(a));
}

/**
 * Neighbours of a post within a newest-first list: `newer` (the more recent
 * post) and `older` (the next one back). Either may be undefined at the ends.
 */
export function adjacentPosts<T extends { slug: string }>(
  postsNewestFirst: T[],
  slug: string,
): { newer?: T; older?: T } {
  const i = postsNewestFirst.findIndex((p) => p.slug === slug);
  if (i === -1) return {};
  return {
    newer: i > 0 ? postsNewestFirst[i - 1] : undefined,
    older: i < postsNewestFirst.length - 1 ? postsNewestFirst[i + 1] : undefined,
  };
}

const FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** Consistent "Mon D, YYYY"; empty string when unparseable. */
export function formatPostDate(value: string): string {
  if (!value) return "";
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return "";
  return FMT.format(new Date(ts));
}
