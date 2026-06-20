import type {
  ContactBlock,
  PortfolioContent,
  Post,
  Profile,
  Section,
  SiteMeta,
} from "@/lib/types";

import siteJson from "@/content/site.json";
import profileJson from "@/content/profile.json";
import writingJson from "@/content/writing.json";
import sectionsJson from "@/content/sections.json";
import contactJson from "@/content/contact.json";

/**
 * Single source of truth for all page content.
 *
 * Today this reads the static JSON files in /content. It is intentionally
 * `async` so the swap to Supabase is a drop-in: replace the bodies below with
 * `await supabase.from('profile').select()...` etc. — every caller already
 * awaits this, so nothing else changes.
 *
 * Suggested Supabase tables (one per JSON file):
 *   site (1 row) · profile (1 row) · posts · sections · section_entries · contact
 */
export async function getContent(): Promise<PortfolioContent> {
  return {
    site: siteJson as SiteMeta,
    profile: profileJson as Profile,
    posts: writingJson as Post[],
    sections: sectionsJson as Section[],
    contact: contactJson as ContactBlock,
  };
}

/** Convenience accessor for the article overlay / future /writing/[slug] routes. */
export async function getPost(slug: string): Promise<Post | undefined> {
  const { posts } = await getContent();
  return posts.find((p) => p.slug === slug);
}
