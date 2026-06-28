-- Public storage bucket for blog post images.
-- Anyone can read (public bucket -> public URLs render on the site);
-- only authenticated users (the admin) can upload/update/delete.
-- Mirrors the table RLS model in 0001: public read, authenticated write.

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "blog images public read"
  on storage.objects for select
  using (bucket_id = 'blog-images');

create policy "blog images auth insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-images');

create policy "blog images auth update"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-images') with check (bucket_id = 'blog-images');

create policy "blog images auth delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'blog-images');
