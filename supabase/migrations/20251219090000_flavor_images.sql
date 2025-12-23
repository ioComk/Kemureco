alter table public.flavors
  add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('flavor-images', 'flavor-images', true)
on conflict (id) do nothing;

create policy "Flavor images are readable by anyone"
  on storage.objects
  for select
  using (bucket_id = 'flavor-images');

create policy "Authenticated users can upload flavor images"
  on storage.objects
  for insert
  with check (bucket_id = 'flavor-images' and auth.role() = 'authenticated');

create policy "Users can update their flavor images"
  on storage.objects
  for update
  using (bucket_id = 'flavor-images' and owner = auth.uid())
  with check (bucket_id = 'flavor-images' and owner = auth.uid());

create policy "Users can delete their flavor images"
  on storage.objects
  for delete
  using (bucket_id = 'flavor-images' and owner = auth.uid());
