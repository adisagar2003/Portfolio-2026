-- Optional cover image per post: shown at the top of the article and used as
-- the Open Graph / Twitter card image when the post is shared.
alter table public.posts add column if not exists cover_url text;
