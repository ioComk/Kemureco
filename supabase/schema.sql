create table if not exists public.brands (
  id serial primary key,
  name text not null unique,
  jp_available boolean not null default true
);

create table if not exists public.flavors (
  id serial primary key,
  brand_id integer not null references public.brands(id) on delete cascade,
  name text not null,
  tags text[] default array[]::text[],
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.mixes (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.mix_components (
  mix_id integer not null references public.mixes(id) on delete cascade,
  flavor_id integer not null references public.flavors(id) on delete cascade,
  ratio_percent integer not null check (ratio_percent between 1 and 100),
  layer_order integer not null,
  constraint mix_components_pkey primary key (mix_id, flavor_id)
);

create table if not exists public.sessions (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc'::text, now()),
  location_text text
);

alter table public.brands enable row level security;
alter table public.flavors enable row level security;
alter table public.mixes enable row level security;
alter table public.mix_components enable row level security;
alter table public.sessions enable row level security;

create policy "Brands are readable by anyone"
  on public.brands for select
  using (true);

create policy "Flavors are readable by anyone"
  on public.flavors for select
  using (true);

create policy "Authenticated users can insert brands"
  on public.brands
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can insert flavors"
  on public.flavors
  for insert
  with check (auth.role() = 'authenticated');

create policy "Users manage their mixes"
  on public.mixes
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their mix components"
  on public.mix_components
  for all
  using (exists(select 1 from public.mixes m where m.id = mix_components.mix_id and m.user_id = auth.uid()))
  with check (exists(select 1 from public.mixes m where m.id = mix_components.mix_id and m.user_id = auth.uid()));

create policy "Users manage their sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.brands is 'Shisha flavor brands';
comment on table public.flavors is 'Individual flavors belonging to brands';
comment on table public.mixes is 'User-created mixes';
comment on table public.mix_components is 'Flavor ratio per mix';
comment on table public.sessions is 'Smoking session logs';
