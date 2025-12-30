insert into public.brands (name, jp_available) values
  ('DARKSIDE', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags)
select b.id, f.name, f.tags::text[]
from (
  values
    ('DARKSIDE', 'SUPERMINT', '{mint}'),
    ('DARKSIDE', 'SPACE JAM', '{}'),
    ('DARKSIDE', 'SALBEI', '{}'),
    ('DARKSIDE', 'BOUNTY HUNTER', '{}'),
    ('DARKSIDE', 'BLUEBERRY BLAST', '{blueberry,berry}'),
    ('DARKSIDE', 'KILLER MILK', '{milk}'),
    ('DARKSIDE', 'HONEY DUST', '{honey}'),
    ('DARKSIDE', 'DARK ICECREAM', '{cream,ice}'),
    ('DARKSIDE', 'GREEN MIST', '{}'),
    ('DARKSIDE', 'BERGAMONSTR', '{}'),
    ('DARKSIDE', 'GUAVA REBEL', '{}'),
    ('DARKSIDE', 'MANGO LASSI 2.0', '{}'),
    ('DARKSIDE', 'DARK PASSION', '{passion}'),
    ('DARKSIDE', 'BRVY ORANGE', '{orange}'),
    ('DARKSIDE', 'COSMOS', '{}'),
    ('DARKSIDE', 'C.R.E.A.M.S.O.D.A.', '{}'),
    ('DARKSIDE', 'DARKSUPRA', '{}'),
    ('DARKSIDE', 'NEEDLS', '{}'),
    ('DARKSIDE', 'TROPIC RAY', '{}'),
    ('DARKSIDE', 'CHERRY ROCKS', '{cherry}'),
    ('DARKSIDE', 'GENERIS RASPBERRY', '{raspberry,berry}'),
    ('DARKSIDE', 'BANANAPAPA', '{banana}'),
    ('DARKSIDE', 'WILD FOREST', '{forest}'),
    ('DARKSIDE', 'WILD BERRY', '{berry}'),
    ('DARKSIDE', 'FALLING STAR', '{}'),
    ('DARKSIDE', 'RED ALERT', '{}'),
    ('DARKSIDE', 'COSMO FLOWER', '{}'),
    ('DARKSIDE', 'PINEAPPLE PULSE', '{pineapple}'),
    ('DARKSIDE', 'KALEE GRAPEFRUIT 2.0', '{grape,grapefruit}'),
    ('DARKSIDE', 'ICE GRANNY', '{ice}'),
    ('DARKSIDE', 'LEMONBLAST', '{lemon}'),
    ('DARKSIDE', 'GRAPE CORE', '{grape}'),
    ('DARKSIDE', 'DARKSIDE COLA', '{cola}'),
    ('DARKSIDE', 'SUPERNOVA', '{}')
) as f(brand_name, name, tags)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);
