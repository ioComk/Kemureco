insert into public.brands (name, jp_available) values
  ('Serbetli', false),
  ('Hookain', false),
  ('Starbuzz', true),
  ('Adalya', false),
  ('Ugly', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Serbetli', 'Ice Berry', '{berry,ice}'),
    ('Serbetli', 'Green Mix', '{lime,herbal}'),
    ('Hookain', 'White Caek', '{cake,vanilla}'),
    ('Hookain', 'Pineapple Mama', '{pineapple,tropical}'),
    ('Starbuzz', 'Blue Mist', '{berry,mint}'),
    ('Starbuzz', 'Pirates Cave', '{lime,sweet}'),
    ('Adalya', 'Lady Killer', '{melon,mango}'),
    ('Adalya', 'Love 66', '{passionfruit,watermelon,mint}'),
    ('Ugly', 'Cold Blooded', '{berry,spice}'),
    ('Ugly', 'Kashmir Black Peach', '{peach,spice}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
