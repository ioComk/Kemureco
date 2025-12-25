insert into public.brands (name, jp_available) values
  ('Cookies', false),
  ('Eternal Smoke', false)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Al Fakher', 'Apricot', '{apricot,fruit}'),
    ('Al Fakher', 'Vanilla', '{vanilla,dessert}'),
    ('Al Fakher', 'Georgia Peach Pie', '{peach,dessert}'),
    ('Al Fakher', 'Plum', '{plum,fruit}'),
    ('Al Fakher', 'Apple', '{apple,fruit}'),
    ('Al Fakher', 'Blueberry', '{blueberry,berry}'),
    ('Al Fakher', 'Grape', '{grape,fruit}'),
    ('Al Fakher', 'Two Apples', '{apple,classic}'),
    ('Al Fakher', 'Grenadine', '{pomegranate,sweet}'),
    ('Al Fakher', 'Fresh', '{mint,cool}'),
    ('Al Fakher', 'Florida Orange Creamsicle', '{orange,cream,dessert}'),
    ('Al Fakher', 'Grapefruit', '{grapefruit,citrus}'),
    ('Al Fakher', 'Lemon', '{lemon,citrus}'),
    ('Al Fakher', 'Orange', '{orange,citrus}'),
    ('Al Fakher', 'Two Apples Mint', '{apple,mint}'),
    ('Al Fakher', 'Mint', '{mint}'),
    ('Al Fakher', 'Lemon Mint', '{lemon,mint}'),
    ('Al Fakher', 'Grapefruit Mint', '{grapefruit,mint}'),
    ('Al Fakher', 'Blueberry Mint', '{blueberry,mint}'),
    ('Al Fakher', 'Gum Mint', '{mint,sweet}'),
    ('Al Fakher', 'Citrus Mint', '{citrus,mint}'),
    ('Al Fakher', 'Cherry Mint', '{cherry,mint}'),
    ('Adalya', 'Orange Mint', '{orange,mint}'),
    ('Tangiers', 'Cane Mint', '{mint}'),
    ('Cookies', 'Cookies x Al Fakher Citrus Zen', '{citrus,mix}'),
    ('Cookies', 'Cookies x Al Fakher Lemon Icy', '{lemon,ice}'),
    ('Cookies', 'Cookies x Al Fakher Sandia', '{watermelon,fruit}'),
    ('Eternal Smoke', 'Aloha Nights', '{tropical,fruit}'),
    ('Eternal Smoke', 'Caribbean Nights', '{tropical,fruit}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
