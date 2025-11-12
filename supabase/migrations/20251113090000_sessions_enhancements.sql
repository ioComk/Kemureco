alter table public.sessions
  add column if not exists mix_id integer references public.mixes(id) on delete set null,
  add column if not exists satisfaction integer check (satisfaction between 1 and 5) default 3,
  add column if not exists notes text;
