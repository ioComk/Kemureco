alter table public.flavors
  add column if not exists created_by uuid references auth.users(id) on delete set null;

drop policy if exists "Authenticated users can insert flavors" on public.flavors;
create policy "Authenticated users can insert flavors"
  on public.flavors
  for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

drop policy if exists "Users can delete their own flavors" on public.flavors;
create policy "Users can delete their own flavors"
  on public.flavors
  for delete
  using (created_by = auth.uid());
