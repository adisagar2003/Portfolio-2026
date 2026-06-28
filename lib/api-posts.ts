// Validation + normalization for the POST /api/posts payload. Pure + tested so
// the public endpoint's input handling is predictable and hard to abuse.

export interface NormalizedPostInput {
  title: string;
  body: string;
  slug?: string;
  excerpt?: string;
  date?: string;
  meta?: string;
  coverUrl: string | null;
  published: boolean;
  sortOrder: number;
  overwrite: boolean;
}

export type ParseResult =
  | { ok: true; value: NormalizedPostInput }
  | { ok: false; error: string };

function optStr(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t === "" ? undefined : t;
}

/** Validate a delete request body: requires a non-empty string slug. */
export function parseDeleteInput(
  payload: unknown,
): { ok: true; slug: string } | { ok: false; error: string } {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const slug = (payload as Record<string, unknown>).slug;
  if (typeof slug !== "string" || slug.trim() === "") {
    return { ok: false, error: "slug is required and must be a non-empty string." };
  }
  return { ok: true, slug: slug.trim() };
}

export function parsePostInput(payload: unknown): ParseResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const p = payload as Record<string, unknown>;

  if (typeof p.title !== "string" || p.title.trim() === "") {
    return { ok: false, error: "title is required and must be a non-empty string." };
  }
  if (typeof p.body !== "string" || p.body.trim() === "") {
    return { ok: false, error: "body (markdown) is required and must be a non-empty string." };
  }

  const sortRaw = Number(p.sort_order);
  const value: NormalizedPostInput = {
    title: p.title.trim(),
    body: p.body.trim(),
    slug: optStr(p.slug),
    excerpt: optStr(p.excerpt),
    date: optStr(p.date),
    meta: optStr(p.meta),
    coverUrl: typeof p.cover_url === "string" && p.cover_url.trim() !== ""
      ? p.cover_url.trim()
      : null,
    published: p.published === undefined ? true : Boolean(p.published),
    sortOrder: Number.isFinite(sortRaw) ? Math.trunc(sortRaw) : 0,
    overwrite: Boolean(p.overwrite),
  };
  return { ok: true, value };
}
