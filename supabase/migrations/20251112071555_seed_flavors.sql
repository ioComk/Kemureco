insert into public.brands (name, jp_available) values
  ('Trifecta', true),
  ('Tangiers', false),
  ('Fumari', true),
  ('Al Fakher', true),
  ('Azure', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Trifecta', 'Twice the Ice X', '{mint,ice,strong}'),
    ('Trifecta', 'Enigma', '{spice,anise}'),
    ('Tangiers', 'Kashmir Peach', '{peach,spice}'),
    ('Fumari', 'White Gummi Bear', '{pineapple,candy}'),
    ('Fumari', 'Mint Chocolate Chill', '{mint,dessert}'),
    ('Al Fakher', 'Double Apple', '{apple,classic}'),
    ('Azure', 'Lemon Muffin', '{lemon,dessert}'),
    ('Azure', 'Citrus Mania', '{citrus,mix}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name;
