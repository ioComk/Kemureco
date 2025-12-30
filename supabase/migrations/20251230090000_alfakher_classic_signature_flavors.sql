insert into public.brands (name, jp_available) values
  ('Al Fakher', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Al Fakher', 'Mint', '{mint}'),
    ('Al Fakher', 'Two Apples', '{apple}'),
    ('Al Fakher', 'Gum with Mint', '{mint,gum}'),
    ('Al Fakher', 'Blueberry with Mint', '{mint,blueberry,berry}'),
    ('Al Fakher', 'Orange with Mint', '{mint,orange}'),
    ('Al Fakher', 'Lemon with Mint', '{mint,lemon}'),
    ('Al Fakher', 'Watermelon with Mint', '{mint,watermelon,melon}'),
    ('Al Fakher', 'Blueberry', '{blueberry,berry}'),
    ('Al Fakher', 'Two Apples Bahraini', '{apple}'),
    ('Al Fakher', 'Peach', '{peach}'),
    ('Al Fakher', 'Watermelon', '{watermelon,melon}'),
    ('Al Fakher', 'Grape with Mint', '{mint,grape}'),
    ('Al Fakher', 'Two Apples with Mint', '{mint,apple}'),
    ('Al Fakher', 'Grape', '{grape}'),
    ('Al Fakher', 'Orange', '{orange}'),
    ('Al Fakher', 'Vanilla', '{vanilla}'),
    ('Al Fakher', 'Strawberry', '{strawberry,berry}'),
    ('Al Fakher', 'Kiwi', '{kiwi}'),
    ('Al Fakher', 'Mango', '{mango}'),
    ('Al Fakher', 'Mint with Cream', '{mint,cream}'),
    ('Al Fakher', 'Gum', '{gum}'),
    ('Al Fakher', 'Guava', '{guava}'),
    ('Al Fakher', 'Pineapple', '{pineapple}'),
    ('Al Fakher', 'Grapefruit with Mint', '{mint,grapefruit}'),
    ('Al Fakher', 'Citrus with Mint', '{mint,citrus}'),
    ('Al Fakher', 'Lemon', '{lemon}'),
    ('Al Fakher', 'Melon', '{melon}'),
    ('Al Fakher', 'Cherry', '{cherry}'),
    ('Al Fakher', 'Berry', '{berry}'),
    ('Al Fakher', 'Orange with Cream', '{orange,cream}'),
    ('Al Fakher', 'Grapefruit', '{grapefruit}'),
    ('Al Fakher', 'Cocktail', '{cocktail}'),
    ('Al Fakher', 'Gum with Cinnamon', '{gum,cinnamon}'),
    ('Al Fakher', 'Cherry with Mint', '{mint,cherry}'),
    ('Al Fakher', 'Fresh...!', '{}'),
    ('Al Fakher', 'Hubbly', '{}'),
    ('Al Fakher', 'Coconut', '{coconut}'),
    ('Al Fakher', 'Mojito', '{mojito}'),
    ('Al Fakher', 'Strawberry with Cream', '{strawberry,cream,berry}'),
    ('Al Fakher', 'Rose', '{rose}'),
    ('Al Fakher', 'Grenadine', '{grenadine}'),
    ('Al Fakher', 'Grape with Berry', '{grape,berry}'),
    ('Al Fakher', 'Banana', '{banana}'),
    ('Al Fakher', 'Apple', '{apple}'),
    ('Al Fakher', 'Apricot', '{apricot}'),
    ('Al Fakher', 'Plum', '{plum}'),
    ('Al Fakher', 'Cappuccino', '{cappuccino}'),
    ('Al Fakher', 'Cinnamon', '{cinnamon}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
