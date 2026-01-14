insert into public.brands (name, jp_available)
values ('Starline', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
    ('Starline', 'APPLE JUICE', '{apple}', 'flavors/Starline/APPLE JUICE.webp'),
    ('Starline', 'BELGIAN WAFFLE', '{}', 'flavors/Starline/BELGIAN WAFFLE.webp'),
    ('Starline', 'BERRY POPCORN', '{}', 'flavors/Starline/BERRY POPCORN.webp'),
    ('Starline', 'BLUEBERRY CRUMBLE', '{}', 'flavors/Starline/BLUEBERRY CRUMBLE.webp'),
    ('Starline', 'FREE CUBA', '{}', 'flavors/Starline/FREE CUBA.webp'),
    ('Starline', 'LEMON FIZZ', '{lemon}', 'flavors/Starline/LEMON FIZZ.webp'),
    ('Starline', 'NECTARINE', '{}', 'flavors/Starline/NECTARINE.webp'),
    ('Starline', 'ORANGINA', '{orange}', 'flavors/Starline/ORANGINA.webp'),
    ('Starline', 'PAPAYA', '{}', 'flavors/Starline/PAPAYA.webp'),
    ('Starline', 'STRAWBERRY MILLEFEUILLE', '{strawberry}', 'flavors/Starline/STRAWBERRY MILLEFEUILLE.webp')
) as f(brand_name, name, tags, image_path)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
