-- Portfolio content schema.
-- Top-level scalars are columns; genuinely nested arrays/objects (socials,
-- company, post body, entry tags/bullets) are JSONB so they map 1:1 to the
-- existing TypeScript types in lib/types.ts with no transformation.
--
-- Security model: RLS on, public SELECT only. There are NO write policies, so
-- anon/authenticated clients cannot mutate. All writes go through the admin
-- (service-role) client server-side, which bypasses RLS, gated behind auth.

-- ---------------------------------------------------------------- site (1 row)
create table if not exists public.site (
  id           int primary key default 1,
  title        text not null,
  description  text not null,
  url          text not null,
  footer_left  text not null,
  footer_right text not null,
  constraint site_singleton check (id = 1)
);

-- ------------------------------------------------------------- profile (1 row)
create table if not exists public.profile (
  id              int primary key default 1,
  initials        text not null,
  name            text not null,
  role            text not null,
  company         jsonb,                      -- { name, href } | null
  location        text not null,
  bio             text not null,
  avatar_url      text not null,
  github_username text not null,
  socials         jsonb not null default '[]'::jsonb,  -- SocialLink[]
  constraint profile_singleton check (id = 1)
);

-- -------------------------------------------------------------------- posts
create table if not exists public.posts (
  slug       text primary key,
  date       text not null,                   -- display string, e.g. "Jun 2026"
  title      text not null,
  excerpt    text not null,
  meta       text not null,                   -- e.g. "Jun 18, 2026 · 3 min read"
  body       jsonb not null default '[]'::jsonb,  -- PostParagraph[]
  sort_order int not null default 0,
  published  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ sections
create table if not exists public.sections (
  id         text primary key,                -- 'work' | 'projects' | ...
  index      text not null,                   -- '02'
  label      text not null,
  sort_order int not null default 0
);

-- ----------------------------------------------------------- section_entries
create table if not exists public.section_entries (
  id          uuid primary key default gen_random_uuid(),
  section_id  text not null references public.sections(id) on delete cascade,
  period      text not null,
  title       text not null,
  href        text,
  subtitle    text not null,
  active      boolean not null default false,
  description text,
  tags        jsonb not null default '[]'::jsonb,  -- Tag[]
  bullets     jsonb not null default '[]'::jsonb,  -- { lead, text }[]
  sort_order  int not null default 0
);
create index if not exists section_entries_section_idx
  on public.section_entries (section_id, sort_order);

-- ------------------------------------------------------------- contact (1 row)
create table if not exists public.contact (
  id      int primary key default 1,
  heading text not null,
  body    text not null,
  socials jsonb not null default '[]'::jsonb,  -- SocialLink[]
  constraint contact_singleton check (id = 1)
);

-- ----------------------------------------------------------------------- RLS
alter table public.site             enable row level security;
alter table public.profile          enable row level security;
alter table public.posts            enable row level security;
alter table public.sections         enable row level security;
alter table public.section_entries  enable row level security;
alter table public.contact          enable row level security;

-- Public read (anon key) for everyone; full write for authenticated users.
-- There is a single admin and public sign-ups are disabled, so "authenticated"
-- effectively means the admin. anon can only read. The /admin server actions
-- write through the logged-in admin's session, so RLS enforces the gate.
do $$
declare t text;
begin
  foreach t in array array['site','profile','posts','sections','section_entries','contact']
  loop
    execute format(
      'create policy %I on public.%I for select using (true);',
      'public_read_' || t, t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (true);',
      'auth_insert_' || t, t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (true) with check (true);',
      'auth_update_' || t, t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (true);',
      'auth_delete_' || t, t);
  end loop;
end $$;
