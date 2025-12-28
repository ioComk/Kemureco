drop policy if exists "Flavors are readable by anyone" on public.flavors;
drop policy if exists "Flavors are readable by owners or public seeds" on public.flavors;
create policy "Flavors are readable by owners or public seeds"
  on public.flavors
  for select
  using (created_by is null or created_by = auth.uid());
