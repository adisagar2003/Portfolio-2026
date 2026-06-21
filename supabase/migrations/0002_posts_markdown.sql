-- Switch post bodies from a JSONB paragraph array to plain markdown.
-- Backfills body_md from the existing body (italic paragraphs -> _emphasis_),
-- then drops the old JSONB column.

alter table public.posts add column if not exists body_md text not null default '';

update public.posts p
set body_md = sub.md
from (
  select t.slug,
    string_agg(
      case when (e->>'italic') = 'true' then '_' || (e->>'text') || '_' else e->>'text' end,
      E'\n\n' order by ord
    ) as md
  from public.posts t,
       lateral jsonb_array_elements(t.body) with ordinality as a(e, ord)
  group by t.slug
) sub
where p.slug = sub.slug;

alter table public.posts drop column body;
