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

The first two are public (safe in the browser — reads are protected by RLS):

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

Two **server-only secrets** are needed for the agent-facing blog API (below).
Never expose these to the browser; set them in Vercel as well:

```
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # Supabase → Settings → API
BLOG_API_KEY=<bearer token your agents send>   # any long random string
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

## Writing blog posts (`/admin`)

The post editor is built for writing. Open `/admin`, expand **✍️ Write a new
post** (it's pinned to the top), and:

- **Markdown editor with live preview** — Write / Split / Preview modes; the
  preview uses the *same* renderer as the public page, and in split view it
  scroll-syncs with the editor.
- **Formatting toolbar + shortcuts** — bold/italic/headings/quote/lists/link/
  code/table, plus `⌘B` `⌘I` `⌘K` (link) `⌘S` (save). Tab indents; Enter
  continues lists.
- **Images** — upload via the toolbar, **drag-and-drop, or paste** straight in;
  files go to the `blog-images` Supabase Storage bucket. The 🗂 **image
  library** browses/reuses/deletes past uploads. Each post can also have a
  **cover image** (article header + social card).
- **Less typing** — slug auto-derives from the title, the meta line
  (`date · N min read`) and excerpt auto-generate, and the date defaults to
  today. **Duplicate as template** clones an existing post.
- **Safety** — drafts autosave to your browser (with restore), an
  unsaved-changes guard warns before you navigate away, and a slug-collision
  guard blocks accidentally overwriting another post.
- **Navigation** — 🔍 find & replace, ☰ document outline, distraction-free
  fullscreen, and a searchable / draft-filterable / reorderable post list.

Storage + cover columns are created by the migrations in `supabase/migrations/`
(`0003_blog_images_storage.sql`, `0004_posts_cover_url.sql`).

## Blog API (for agents)

`POST /api/posts` lets a trusted agent publish a post without a browser
session. It authenticates with the `BLOG_API_KEY` bearer token and writes via
the Supabase service-role client (so both `SUPABASE_SERVICE_ROLE_KEY` and
`BLOG_API_KEY` must be set).

```bash
curl -X POST https://<your-domain>/api/posts \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My post title",
    "body": "# Hello\n\nWritten in **markdown**.",
    "published": true
  }'
```

- **Required:** `title`, `body` (markdown).
- **Auto-derived if omitted:** `slug`, `excerpt`, `date`, `meta` (read time).
- **Optional:** `cover_url`, `published` (default `true`), `sort_order`,
  `overwrite` (default `false`).
- **Responses:** `201` created (`{ ok, slug, url, post }`) · `401` bad/missing
  key · `400` invalid input (non-string/empty `title`/`body`) · `409` slug
  already exists — the body includes a free `suggestion` (e.g. `my-post-2`);
  pass `"overwrite": true` to replace instead · `500` server not configured.

### Other methods (same auth)

- **`GET /api/posts`** — list every post (incl. drafts):
  `{ count, posts: [{ slug, title, published, url, date }] }`. Use it to check
  what exists before writing.
- **`DELETE /api/posts`** — remove a post: body `{ "slug": "..." }`. Returns
  `{ ok, deleted }`, or `404` if the slug doesn't exist.

All three methods use a timing-safe key check, accept either
`Authorization: Bearer <key>` or `x-api-key: <key>`, and revalidate `/` and
`/writing/[slug]` so changes appear immediately. Input is validated/normalized
by `lib/api-posts.ts` (covered by Vitest).

## Deploy

Deployed on **Vercel** (`vercel.json` pins the Next.js framework + build
commands; Node 22.x). Set both `NEXT_PUBLIC_SUPABASE_*` env vars in the Vercel
project for the database-backed content and admin to work.
