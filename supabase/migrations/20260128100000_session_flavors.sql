-- session_flavorsテーブルを作成
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

-- インデックス作成
create index if not exists idx_session_flavors_session_id on public.session_flavors(session_id);
create index if not exists idx_session_flavors_flavor_id on public.session_flavors(flavor_id);

-- RLS有効化
alter table public.session_flavors enable row level security;

-- RLSポリシー設定
create policy "Users manage their session flavors"
  on public.session_flavors
  for all
  using (exists(select 1 from public.sessions s where s.id = session_flavors.session_id and s.user_id = auth.uid()))
  with check (exists(select 1 from public.sessions s where s.id = session_flavors.session_id and s.user_id = auth.uid()));

-- 既存データ移行（sessions.mix_id → session_flavors）
insert into public.session_flavors (session_id, flavor_id, ratio_percent, grams, layer_order)
select
  s.id,
  mc.flavor_id,
  mc.ratio_percent,
  mc.grams,
  mc.layer_order
from public.sessions s
inner join public.mixes m on s.mix_id = m.id
inner join public.mix_components mc on m.id = mc.mix_id;

-- sessions.mix_idカラム削除
alter table public.sessions drop column if exists mix_id;

-- mix_componentsテーブル削除
drop table if exists public.mix_components cascade;

-- mixesテーブル削除
drop table if exists public.mixes cascade;

-- コメント追加
comment on table public.session_flavors is 'Flavors used in each session';
