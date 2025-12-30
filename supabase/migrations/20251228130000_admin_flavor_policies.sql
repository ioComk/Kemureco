create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

drop policy if exists "Flavors are readable by owners or public seeds" on public.flavors;
create policy "Flavors are readable by owners, public seeds, or admins"
  on public.flavors for select
  using (created_by is null or created_by = auth.uid() or public.is_admin());

create policy "Admins can update existing flavors"
  on public.flavors for update
  using (public.is_admin() and created_by is null)
  with check (public.is_admin() and created_by is null);

create policy "Admins can delete existing flavors"
  on public.flavors for delete
  using (public.is_admin() and created_by is null);
