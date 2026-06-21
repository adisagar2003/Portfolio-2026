import { cache } from "react";
import type {
  ContactBlock,
  PortfolioContent,
  Post,
  Profile,
  Section,
  SiteMeta,
  TimelineEntry,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/server";

// JSON fallback (used until Supabase env vars + seeded tables exist, and for
// local dev / resilience if a query fails).
import siteJson from "@/content/site.json";
import profileJson from "@/content/profile.json";
import writingJson from "@/content/writing.json";
import sectionsJson from "@/content/sections.json";
import contactJson from "@/content/contact.json";

function fromJson(): PortfolioContent {
  return {
    site: siteJson as SiteMeta,
    profile: profileJson as Profile,
    posts: writingJson as Post[],
    sections: sectionsJson as Section[],
    contact: contactJson as ContactBlock,
  };
}

/**
 * Single source of truth for page content. Reads from Supabase when configured,
 * otherwise (or on any error) falls back to the bundled JSON so the site always
 * renders. Wrapped in React `cache()` so one request = one set of queries even
 * though both the page and generateMetadata call it.
 */
export const getContent = cache(async (): Promise<PortfolioContent> => {
  if (!hasSupabaseEnv()) return fromJson();

  try {
    const supabase = await createClient();
    const [site, profile, posts, sections, entries, contact] =
      await Promise.all([
        supabase.from("site").select("*").eq("id", 1).single(),
        supabase.from("profile").select("*").eq("id", 1).single(),
        supabase
          .from("posts")
          .select("*")
          .eq("published", true)
          .order("sort_order", { ascending: true }),
        supabase.from("sections").select("*").order("sort_order", {
          ascending: true,
        }),
        supabase
          .from("section_entries")
          .select("*")
          .order("sort_order", { ascending: true }),
        supabase.from("contact").select("*").eq("id", 1).single(),
      ]);

    // Any failure (tables not created yet, RLS, network) -> JSON fallback.
    if (
      site.error ||
      profile.error ||
      posts.error ||
      sections.error ||
      entries.error ||
      contact.error ||
      !site.data ||
      !profile.data ||
      !contact.data
    ) {
      return fromJson();
    }

    const entriesBySection = new Map<string, TimelineEntry[]>();
    for (const e of entries.data ?? []) {
      const entry: TimelineEntry = {
        period: e.period,
        title: e.title,
        href: e.href ?? undefined,
        subtitle: e.subtitle,
        active: e.active ?? undefined,
        description: e.description ?? undefined,
        tags: e.tags ?? [],
        bullets: e.bullets ?? [],
      };
      const list = entriesBySection.get(e.section_id) ?? [];
      list.push(entry);
      entriesBySection.set(e.section_id, list);
    }

    return {
      site: {
        title: site.data.title,
        description: site.data.description,
        url: site.data.url,
        footerLeft: site.data.footer_left,
        footerRight: site.data.footer_right,
      },
      profile: {
        initials: profile.data.initials,
        name: profile.data.name,
        role: profile.data.role,
        company: profile.data.company ?? undefined,
        location: profile.data.location,
        bio: profile.data.bio,
        avatarUrl: profile.data.avatar_url,
        githubUsername: profile.data.github_username,
        socials: profile.data.socials ?? [],
      },
      posts: (posts.data ?? []).map((p) => ({
        slug: p.slug,
        date: p.date,
        title: p.title,
        excerpt: p.excerpt,
        meta: p.meta,
        body: p.body_md ?? "",
      })),
      sections: (sections.data ?? []).map(
        (s): Section => ({
          id: s.id,
          index: s.index,
          label: s.label,
          entries: entriesBySection.get(s.id) ?? [],
        }),
      ),
      contact: {
        heading: contact.data.heading,
        body: contact.data.body,
        socials: contact.data.socials ?? [],
      },
    };
  } catch {
    return fromJson();
  }
});

/** Convenience accessor for the article overlay / future /writing/[slug] routes. */
export async function getPost(slug: string): Promise<Post | undefined> {
  const { posts } = await getContent();
  return posts.find((p) => p.slug === slug);
}
