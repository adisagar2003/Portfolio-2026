// Shared content shapes. These mirror the JSON files in /content today and are
// the exact rows you'd back with Supabase tables later (one type ≈ one table).

export interface SocialLink {
  /** "github" | "linkedin" | "email" — picks the icon to render */
  kind: "github" | "linkedin" | "email";
  label: string;
  href: string;
}

export interface Profile {
  initials: string;
  name: string;
  /** e.g. "Cross-product ERP Engineer" */
  role: string;
  company?: { name: string; href: string };
  location: string;
  bio: string;
  avatarUrl: string;
  githubUsername: string;
  socials: SocialLink[];
}

export interface Post {
  slug: string;
  /** Short date shown in the list, e.g. "Jun 2026" */
  date: string;
  title: string;
  excerpt: string;
  /** Full date + read time shown on the article page, e.g. "Jun 18, 2026 · 3 min read" */
  meta: string;
  /** Post body written in markdown; rendered to rich HTML on the article page. */
  body: string;
}

export interface Tag {
  label: string;
  /** highlight renders in the copper accent (e.g. "AI-assisted") */
  highlight?: boolean;
}

export interface TimelineEntry {
  /** Left-column period, e.g. "2025 — Now" */
  period: string;
  title: string;
  /** Optional external link for the title (project link) */
  href?: string;
  /** Sub-line in accent color, e.g. "Software Engineer · ERP" */
  subtitle: string;
  /** Show a pulsing dot before the subtitle (e.g. "In active development") */
  active?: boolean;
  description?: string;
  tags?: Tag[];
  /** Optional bullet list (used by the "Built for the love of it" entry) */
  bullets?: { lead: string; text: string }[];
}

export interface Section {
  id: string;
  /** Two-digit index shown in the label, e.g. "02" */
  index: string;
  label: string;
  entries: TimelineEntry[];
}

export interface ContactBlock {
  heading: string;
  body: string;
  socials: SocialLink[];
}

export interface SiteMeta {
  title: string;
  description: string;
  url: string;
  footerLeft: string;
  footerRight: string;
}

export interface PortfolioContent {
  site: SiteMeta;
  profile: Profile;
  posts: Post[];
  sections: Section[];
  contact: ContactBlock;
}
