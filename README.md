# Aditya Sagar — Portfolio

Next.js (App Router) + TypeScript portfolio. All copy lives in JSON today; the
data layer is built so a Supabase swap is a one-file change.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (static-prerendered)
```

## Structure

```
app/
  layout.tsx          fonts (Sora / Hanken Grotesk / JetBrains Mono) + metadata
  page.tsx            server component — calls getContent() and assembles sections
  globals.css         design tokens (dark + light themes) and all component styles
components/
  ShaderBackground.tsx  React Bits "Threads" WebGL shader (ogl), copper/red, mouse-reactive
  Nav.tsx               sticky nav + dark/light theme toggle
  Hero.tsx              avatar, name, role, bio, socials
  Writing.tsx           post list + full-screen article overlay
  ContributionGrid.tsx  GitHub commit grid (live fetch + deterministic fallback)
  TimelineSection.tsx   work / projects / education / awards
  Contact.tsx, Footer.tsx, SocialLinks.tsx, RevealController.tsx, icons.tsx
content/
  site.json, profile.json, writing.json, sections.json, contact.json
lib/
  types.ts            content shapes (each type ≈ one future Supabase table)
  content.ts          getContent() — the single data source
```

## The data layer (JSON now, Supabase later)

Every part of the page reads content through one async function,
`getContent()` in `lib/content.ts`. Right now it returns the parsed JSON files.
To move to Supabase, replace the bodies there with queries — nothing else in the
app changes, because every caller already `await`s it:

```ts
// lib/content.ts (after Supabase)
const { data: profile } = await supabase.from("profile").select("*").single();
const { data: posts }   = await supabase.from("posts").select("*").order("date", { ascending: false });
// ...return the same PortfolioContent shape
```

Suggested tables (one per JSON file): `site`, `profile`, `posts`, `sections`,
`section_entries`, `contact`. Enable RLS + a public read policy on each so the
anon key can read them. See the Supabase setup notes shared during the build for
client/server wiring (`lib/supabase/client.ts`, `lib/supabase/server.ts`).

## Editing content

Add a blog post: append an object to `content/writing.json`. Update work,
projects, education, or awards: edit `content/sections.json`. No code changes
needed.
