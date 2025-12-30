insert into public.brands (name, jp_available) values
  ('Adalya', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('Adalya', 'LOVE66', '{mix}'),
    ('Adalya', 'LADY KILLER', '{mango,mint,ice,peach}'),
    ('Adalya', 'HAWAII', '{mango,mint,pineapple}'),
    ('Adalya', 'HAVANA', '{ice,orange,strawberry}'),
    ('Adalya', 'BLUE MELON', '{blueberry,ice,melon}'),
    ('Adalya', 'BAGDADI', '{mint,peach,strawberry,grape}'),
    ('Adalya', 'DOUBLE MELON ICE', '{ice,melon}'),
    ('Adalya', 'SHEIK MONEY', '{pineapple,mint,banana}'),
    ('Adalya', 'IZMIR ROMANTIC', '{mint,orange,watermelon,strawberry}'),
    ('Adalya', 'ENGLISH LORD', '{mango,mint,peach,raspberry}'),
    ('Adalya', 'SWISS BONBON', '{swiss bonbon}'),
    ('Adalya', 'BLUE ICE', '{blueberry,ice}'),
    ('Adalya', 'JK777', '{mint,grape,berry,acai}'),
    ('Adalya', 'CHEWINGGUM MINT', '{mint,gum}'),
    ('Adalya', 'STRAWBERRY BANANA ICE', '{mint,banana,strawberry}'),
    ('Adalya', 'SKY FALL', '{mint,watermelon,peach}'),
    ('Adalya', 'BERLIN NIGHTS', '{mint,peach}'),
    ('Adalya', 'MANGO TANGO ICE', '{mango,ice,passion fruit}'),
    ('Adalya', 'ICE BONBON', '{ice}'),
    ('Adalya', 'DOUBLE MELON', '{melon}'),
    ('Adalya', 'MANGO TANGO', '{mango,cola}'),
    ('Adalya', 'MINT', '{mint}'),
    ('Adalya', 'THE TWO APPLES', '{apple,anis}'),
    ('Adalya', 'DOUBLE APPLE', '{apple,anis}'),
    ('Adalya', 'GUM', '{gum}'),
    ('Adalya', 'GUM MINT', '{mint,gum}'),
    ('Adalya', 'WATERMELON MINT', '{mint,watermelon}'),
    ('Adalya', 'GRAPE MINT', '{mint,grape}'),
    ('Adalya', 'ORANGE MINT', '{mint,orange}'),
    ('Adalya', 'BLUEBERRY MINT', '{mint,blueberry}'),
    ('Adalya', 'VANILLA', '{vanilla}'),
    ('Adalya', 'LEMON MINT', '{lemon,mint}'),
    ('Adalya', 'GRAPE', '{grape}'),
    ('Adalya', 'Adalya Power', '{}'),
    ('Adalya', 'Cindy''s', '{}'),
    ('Adalya', 'Cola Dragon', '{}'),
    ('Adalya', 'Desperado', '{}'),
    ('Adalya', 'Punkman', '{}'),
    ('Adalya', 'Angel Lips', '{}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
