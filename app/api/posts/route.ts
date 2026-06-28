import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/service";
import { slugify, buildMeta, autoExcerpt, uniqueSlug } from "@/lib/post-utils";
import { postSummary } from "@/lib/posts";
import { parsePostInput, parseDeleteInput } from "@/lib/api-posts";

export const dynamic = "force-dynamic";

/**
 * Machine endpoint for agents to publish posts on the owner's behalf.
 *
 *   POST /api/posts
 *   Authorization: Bearer <BLOG_API_KEY>        (or  x-api-key: <BLOG_API_KEY>)
 *   Content-Type: application/json
 *   { "title": "...", "body": "# markdown ...",
 *     "excerpt"?, "slug"?, "date"?, "meta"?, "cover_url"?,
 *     "published"?: true, "sort_order"?: 0, "overwrite"?: false }
 *
 * title and body are required; everything else is auto-derived if omitted.
 */

function authorized(req: NextRequest): boolean {
  const expected = process.env.BLOG_API_KEY;
  if (!expected) return false;
  const header = req.headers.get("authorization");
  const bearer = header?.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : null;
  const provided = bearer ?? req.headers.get("x-api-key") ?? "";
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function bad(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

/** List all posts (incl. drafts) so agents can introspect before writing. */
export async function GET(req: NextRequest) {
  if (!process.env.BLOG_API_KEY) {
    return bad(500, "BLOG_API_KEY is not configured on the server.");
  }
  if (!authorized(req)) return bad(401, "Invalid or missing API key.");

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return bad(500, (e as Error).message);
  }

  const { data, error } = await supabase
    .from("posts")
    .select("slug, title, published, date, created_at")
    .order("created_at", { ascending: false });
  if (error) return bad(500, error.message);

  const posts = (data ?? []).map((r) =>
    postSummary({
      slug: r.slug,
      title: r.title,
      published: r.published,
      date: r.date,
      createdAt: r.created_at,
    }),
  );
  return NextResponse.json({ count: posts.length, posts });
}

/** Delete a post by slug. Body: { "slug": "..." }. */
export async function DELETE(req: NextRequest) {
  if (!process.env.BLOG_API_KEY) {
    return bad(500, "BLOG_API_KEY is not configured on the server.");
  }
  if (!authorized(req)) return bad(401, "Invalid or missing API key.");

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return bad(400, "Body must be valid JSON.");
  }
  const parsed = parseDeleteInput(payload);
  if (!parsed.ok) return bad(400, parsed.error);

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return bad(500, (e as Error).message);
  }

  const { data, error } = await supabase
    .from("posts")
    .delete()
    .eq("slug", parsed.slug)
    .select("slug")
    .maybeSingle();
  if (error) return bad(500, error.message);
  if (!data) return bad(404, `No post with slug "${parsed.slug}".`);

  revalidatePath("/");
  revalidatePath(`/writing/${parsed.slug}`);
  return NextResponse.json({ ok: true, deleted: parsed.slug });
}

export async function POST(req: NextRequest) {
  if (!process.env.BLOG_API_KEY) {
    return bad(500, "BLOG_API_KEY is not configured on the server.");
  }
  if (!authorized(req)) return bad(401, "Invalid or missing API key.");

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return bad(400, "Body must be valid JSON.");
  }

  const parsed = parsePostInput(payload);
  if (!parsed.ok) return bad(400, parsed.error);
  const input = parsed.value;

  // Always slugify — a raw slug with spaces/capitals would 404 on /writing/<slug>.
  const slug = slugify(input.slug || input.title).slice(0, 120);
  if (!slug) return bad(400, "Could not derive a slug; pass one explicitly.");

  const date =
    input.date ||
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  const excerpt = input.excerpt || autoExcerpt(input.body);
  const meta = input.meta || buildMeta(date, input.body);
  const { body, title, coverUrl, published, sortOrder, overwrite } = input;

  let supabase;
  try {
    supabase = createServiceClient();
  } catch (e) {
    return bad(500, (e as Error).message);
  }

  // Guard against silently clobbering an existing post unless overwrite is set.
  if (!overwrite) {
    const { data: existing } = await supabase
      .from("posts")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();
    if (existing) {
      const { data: all } = await supabase.from("posts").select("slug");
      const suggestion = uniqueSlug(slug, (all ?? []).map((r) => r.slug));
      return NextResponse.json(
        {
          error: `A post with slug "${slug}" already exists. Pass "overwrite": true, or retry with the suggested slug.`,
          slug,
          suggestion,
        },
        { status: 409 },
      );
    }
  }

  const row = {
    slug,
    date,
    title,
    excerpt,
    meta,
    body_md: body,
    cover_url: coverUrl,
    published,
    sort_order: sortOrder,
  };

  const { data, error } = await supabase
    .from("posts")
    .upsert(row, { onConflict: "slug" })
    .select()
    .single();

  if (error) return bad(500, error.message);

  // Refresh the public pages so the post shows up immediately.
  revalidatePath("/");
  revalidatePath(`/writing/${slug}`);

  return NextResponse.json(
    { ok: true, slug, url: `/writing/${slug}`, post: data },
    { status: 201 },
  );
}
