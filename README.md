# Aditya Sagar — Portfolio

Personal portfolio built with Next.js (App Router) + TypeScript. Content is
served from Supabase through a single data function, with a built-in `/admin`
editor for editing copy, posts, and timeline entries — and a bundled JSON
fallback so the site always renders even with no database configured.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** (`@supabase/ssr`) — Postgres content + email/password auth
- **react-markdown** + **remark-gfm** — blog posts authored in markdown
- **ogl** — WebGL "Threads" shader background (copper/red, mouse-reactive)
- Fonts via `next/font`: Sora (display), Hanken Grotesk (body), JetBrains Mono

## Run

```bash
npm install
cp .env.example .env.local   # fill in the Supabase anon key (optional — see below)
npm run dev                  # http://localhost:3000
npm run build                # production build
```

**Supabase is optional for local dev.** With no env vars set, `getContent()`
falls back to the JSON files in `content/` and the public site renders fully.
The `/admin` and `/login` routes need Supabase configured.

## Environment

Both values are public (safe in the browser — reads are protected by RLS):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Structure

```
app/
  layout.tsx          fonts + generateMetadata (title/description/OG/Twitter from getContent)
  page.tsx            server component — calls getContent() and assembles sections
  globals.css         design tokens (dark + light themes) and all component styles
  login/              email/password sign-in (server action -> supabase.auth)
  admin/              auth-gated content editor (server actions: actions.ts)
  writing/[slug]/     shareable post page — markdown body + per-post SEO (generateMetadata)
components/
  ShaderBackground.tsx  ogl "Threads" WebGL shader, mouse-reactive
  Nav.tsx               sticky nav + dark/light theme toggle
  Hero.tsx              avatar, name, role, bio, socials
  Writing.tsx           post list — each title links to /writing/[slug]
  ContributionGrid.tsx  GitHub commit grid (live fetch + deterministic fallback)
  TimelineSection.tsx   work / projects / education / awards
  Contact.tsx, Footer.tsx, SocialLinks.tsx, RevealController.tsx, icons.tsx
lib/
  types.ts              content shapes (each type ≈ one Supabase table)
  content.ts            getContent() / getPost() — the single data source
  supabase/
    client.ts           browser client (anon key)
    server.ts           cookie-bound server client + hasSupabaseEnv()
    middleware.ts       refreshes the auth session cookie per request
    admin.ts            requireAdmin() guard — redirects to /login when signed out
content/                JSON fallback: site, profile, writing, sections, contact
middleware.ts           runs updateSession on every non-asset request
```

## The data layer (Supabase, with JSON fallback)

Every part of the page reads content through one cached async function,
`getContent()` in `lib/content.ts`:

- **When Supabase env vars are present**, it runs parallel queries against the
  tables below and maps the rows into the `PortfolioContent` shape.
- **Otherwise — or if any query errors** (tables not seeded, RLS, network) — it
  returns the bundled `content/*.json` so the site never breaks.

It's wrapped in React `cache()`, so one request runs one set of queries even
though both `page.tsx` and `generateMetadata` call it.

### Tables

`site`, `profile`, `posts`, `sections`, `section_entries`, `contact`.

- `site`, `profile`, `contact` are single-row (`id = 1`).
- `posts` reads only `published = true`, ordered by `sort_order`. Post bodies
  live in `body_md` (markdown).
- `sections` + `section_entries` are joined in code (entries grouped by
  `section_id`) to build each timeline section.
- Enable **RLS** on every table with a **public read** policy (so the anon key
  can read) and an **`authenticated` write** policy (the admin session is the
  authorization).

## Editing content

Two ways:

1. **`/admin`** — sign in at `/login`, then edit site/profile/contact, create
   and publish writing posts (markdown), and add/edit/delete timeline entries.
   All saves go through Server Actions in `app/admin/actions.ts`. Auth is a
   single Supabase user; public sign-ups are disabled.
2. **JSON fallback** — when running without Supabase, edit the files in
   `content/` (`writing.json`, `sections.json`, etc.). No code changes needed.

## Deploy

Deployed on **Vercel** (`vercel.json` pins the Next.js framework + build
commands; Node 22.x). Set both `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel
project for the database-backed content and admin to work.
