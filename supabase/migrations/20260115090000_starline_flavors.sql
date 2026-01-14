insert into public.brands (name, jp_available) values
  ('Starline', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Starline', 'STRAWBERRY MILLEFEUILLE', '{}'),
    ('Starline', 'PAPAYA', '{}'),
    ('Starline', 'ORANGINA', '{}'),
    ('Starline', 'NECTARINE', '{}'),
    ('Starline', 'LEMON FIZZ', '{}'),
    ('Starline', 'FREE CUBA', '{}'),
    ('Starline', 'BLUEBERRY CRUMBLE', '{}'),
    ('Starline', 'BERRY POPCORN', '{}'),
    ('Starline', 'BELGIAN WAFFLE', '{}'),
    ('Starline', 'APPLE JUICE', '{}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);

update public.flavors
