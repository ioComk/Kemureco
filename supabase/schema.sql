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
  image_path text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.sessions (
  id serial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc'::text, now()),
  location_text text,
  satisfaction integer check (satisfaction between 1 and 5) default 3,
  notes text
);

create table if not exists public.session_flavors (
  id serial primary key,
  session_id integer not null references public.sessions(id) on delete cascade,
  flavor_id integer references public.flavors(id) on delete set null,
  custom_flavor_name text,
  custom_brand_name text,
  ratio_percent integer check (ratio_percent between 1 and 100),
  grams numeric(10,2),
  layer_order integer not null default 1,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_session_flavors_session_id on public.session_flavors(session_id);
create index if not exists idx_session_flavors_flavor_id on public.session_flavors(flavor_id);

alter table public.brands enable row level security;
alter table public.flavors enable row level security;
alter table public.sessions enable row level security;
alter table public.session_flavors enable row level security;

create policy "Brands are readable by anyone"
  on public.brands for select
  using (true);

create policy "Flavors are readable by owners or public seeds"
  on public.flavors for select
  using (created_by is null or created_by = auth.uid());

create policy "Authenticated users can insert brands"
  on public.brands
  for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can insert flavors"
  on public.flavors
  for insert
  with check (auth.role() = 'authenticated' and created_by = auth.uid());

create policy "Users can delete their own flavors"
  on public.flavors
  for delete
  using (created_by = auth.uid());

create policy "Users manage their sessions"
  on public.sessions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their session flavors"
  on public.session_flavors
  for all
  using (exists(select 1 from public.sessions s where s.id = session_flavors.session_id and s.user_id = auth.uid()))
  with check (exists(select 1 from public.sessions s where s.id = session_flavors.session_id and s.user_id = auth.uid()));

comment on table public.brands is 'Shisha flavor brands';
comment on table public.flavors is 'Individual flavors belonging to brands';
comment on table public.sessions is 'Smoking session logs';
comment on table public.session_flavors is 'Flavors used in each session';
