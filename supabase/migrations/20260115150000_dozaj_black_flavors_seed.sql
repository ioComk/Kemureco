insert into public.brands (name, jp_available)
values ('DOZAJ BLACK', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
    ('DOZAJ BLACK', 'POMEGRANTE JUICE', '{pomegranate}', 'flavors/DOZAJ BLACK/POMEGRANTE JUICE.webp'),
    ('DOZAJ BLACK', 'CASH PEACH', '{peach}', 'flavors/DOZAJ BLACK/CASH PEACH.webp'),
    ('DOZAJ BLACK', 'Smoothie', '{mix}', 'flavors/DOZAJ BLACK/Smoothie.webp'),
    ('DOZAJ BLACK', 'Ice Cola', '{ice,cola}', 'flavors/DOZAJ BLACK/Ice Cola.webp'),
    ('DOZAJ BLACK', 'Yellow Crumble', '{dessert}', 'flavors/DOZAJ BLACK/Yellow Crumble.webp'),
    ('DOZAJ BLACK', 'Walnut Tree', '{walnut,nut}', 'flavors/DOZAJ BLACK/Walnut Tree.webp'),
    ('DOZAJ BLACK', 'Jamaican Rum', '{rum}', 'flavors/DOZAJ BLACK/Jamaican Rum.webp'),
    ('DOZAJ BLACK', 'Illegal', '{mix}', 'flavors/DOZAJ BLACK/Illegal.webp'),
    ('DOZAJ BLACK', 'Lime&Lemon', '{lime,lemon,citrus}', 'flavors/DOZAJ BLACK/Lime&Lemon.webp'),
    ('DOZAJ BLACK', 'White Cash', '{mix}', 'flavors/DOZAJ BLACK/White Cash.webp'),
    ('DOZAJ BLACK', 'Brownie Peanut', '{dessert,peanut,nut}', 'flavors/DOZAJ BLACK/Brownie Peanut.webp'),
    ('DOZAJ BLACK', 'Breakfast', '{mix}', 'flavors/DOZAJ BLACK/Breakfast.webp'),
    ('DOZAJ BLACK', 'PINK FLIGHT', '{mix}', 'flavors/DOZAJ BLACK/PINK FLIGHT.webp'),
    ('DOZAJ BLACK', 'Holland Waffle', '{dessert}', 'flavors/DOZAJ BLACK/Holland Waffle.webp'),
    ('DOZAJ BLACK', 'El Clasico', '{mix}', 'flavors/DOZAJ BLACK/El Clasico.webp'),
    ('DOZAJ BLACK', 'CHERRY CASH', '{cherry}', 'flavors/DOZAJ BLACK/CHERRY CASH.webp'),
    ('DOZAJ BLACK', 'MOROCCO', '{mint}', 'flavors/DOZAJ BLACK/MOROCCO.webp'),
    ('DOZAJ BLACK', 'MINT STORM', '{mint}', 'flavors/DOZAJ BLACK/MINT STORM.webp'),
    ('DOZAJ BLACK', 'KING OF NECTARINE', '{nectarine}', 'flavors/DOZAJ BLACK/KING OF NECTARINE.webp'),
    ('DOZAJ BLACK', 'MOSCOW ROSE', '{rose}', 'flavors/DOZAJ BLACK/MOSCOW ROSE.webp'),
    ('DOZAJ BLACK', 'HAVANA PURRO', '{tobacco}', 'flavors/DOZAJ BLACK/HAVANA PURRO.webp'),
    ('DOZAJ BLACK', 'BANGUM', '{candy}', 'flavors/DOZAJ BLACK/BANGUM.webp'),
    ('DOZAJ BLACK', 'FOREST BERRY', '{berry}', 'flavors/DOZAJ BLACK/FOREST BERRY.webp'),
    ('DOZAJ BLACK', 'SUMMER LOVE', '{mix}', 'flavors/DOZAJ BLACK/SUMMER LOVE.webp'),
    ('DOZAJ BLACK', 'MUCHO MANGO', '{mango}', 'flavors/DOZAJ BLACK/MUCHO MANGO.webp'),
    ('DOZAJ BLACK', 'CHOCOLATE HAZELNUT CREAM', '{chocolate,hazelnut,cream,nut}', 'flavors/DOZAJ BLACK/CHOCOLATE HAZELNUT CREAM.webp'),
    ('DOZAJ BLACK', 'COOKIE', '{dessert}', 'flavors/DOZAJ BLACK/COOKIE.webp'),
    ('DOZAJ BLACK', 'SUBZERO', '{ice}', 'flavors/DOZAJ BLACK/SUBZERO.webp'),
    ('DOZAJ BLACK', 'TEA TIME', '{tea}', 'flavors/DOZAJ BLACK/TEA TIME.webp'),
    ('DOZAJ BLACK', 'TIRAMISU', '{dessert}', 'flavors/DOZAJ BLACK/TIRAMISU.webp'),
    ('DOZAJ BLACK', 'Earl Grey', '{tea,bergamot,citrus}', 'flavors/DOZAJ BLACK/Earl Grey.webp'),
    ('DOZAJ BLACK', 'Darth Wader', '{mix}', 'flavors/DOZAJ BLACK/Darth Wader.webp'),
    ('DOZAJ BLACK', 'Bumboo', '{mix}', 'flavors/DOZAJ BLACK/Bumboo.webp'),
    ('DOZAJ BLACK', 'Black Queen', '{mix}', 'flavors/DOZAJ BLACK/Black Queen.webp'),
    ('DOZAJ BLACK', 'IRISH CREAM', '{cream}', 'flavors/DOZAJ BLACK/IRISH CREAM.webp'),
    ('DOZAJ BLACK', 'TROPICAL PEARL', '{tropical}', 'flavors/DOZAJ BLACK/TROPICAL PEARL.webp'),
    ('DOZAJ BLACK', 'RED CHOCOMINT', '{chocolate,mint}', 'flavors/DOZAJ BLACK/RED CHOCOMINT.webp'),
    ('DOZAJ BLACK', 'TANGERINE SODA', '{tangerine,citrus}', 'flavors/DOZAJ BLACK/TANGERINE SODA.webp')
) as f(brand_name, name, tags, image_path)
join public.brands b on b.name = f.brand_name
where not exists (
  select 1
  from public.flavors existing
  where existing.brand_id = b.id
    and existing.name = f.name
);

update public.flavors as f
set tags = v.tags::text[],
    image_path = v.image_path,
    created_by = null
from (
  values
    ('DOZAJ BLACK', 'POMEGRANTE JUICE', '{pomegranate}', 'flavors/DOZAJ BLACK/POMEGRANTE JUICE.webp'),
    ('DOZAJ BLACK', 'CASH PEACH', '{peach}', 'flavors/DOZAJ BLACK/CASH PEACH.webp'),
    ('DOZAJ BLACK', 'Smoothie', '{mix}', 'flavors/DOZAJ BLACK/Smoothie.webp'),
    ('DOZAJ BLACK', 'Ice Cola', '{ice,cola}', 'flavors/DOZAJ BLACK/Ice Cola.webp'),
    ('DOZAJ BLACK', 'Yellow Crumble', '{dessert}', 'flavors/DOZAJ BLACK/Yellow Crumble.webp'),
    ('DOZAJ BLACK', 'Walnut Tree', '{walnut,nut}', 'flavors/DOZAJ BLACK/Walnut Tree.webp'),
    ('DOZAJ BLACK', 'Jamaican Rum', '{rum}', 'flavors/DOZAJ BLACK/Jamaican Rum.webp'),
    ('DOZAJ BLACK', 'Illegal', '{mix}', 'flavors/DOZAJ BLACK/Illegal.webp'),
    ('DOZAJ BLACK', 'Lime&Lemon', '{lime,lemon,citrus}', 'flavors/DOZAJ BLACK/Lime&Lemon.webp'),
    ('DOZAJ BLACK', 'White Cash', '{mix}', 'flavors/DOZAJ BLACK/White Cash.webp'),
    ('DOZAJ BLACK', 'Brownie Peanut', '{dessert,peanut,nut}', 'flavors/DOZAJ BLACK/Brownie Peanut.webp'),
    ('DOZAJ BLACK', 'Breakfast', '{mix}', 'flavors/DOZAJ BLACK/Breakfast.webp'),
    ('DOZAJ BLACK', 'PINK FLIGHT', '{mix}', 'flavors/DOZAJ BLACK/PINK FLIGHT.webp'),
    ('DOZAJ BLACK', 'Holland Waffle', '{dessert}', 'flavors/DOZAJ BLACK/Holland Waffle.webp'),
    ('DOZAJ BLACK', 'El Clasico', '{mix}', 'flavors/DOZAJ BLACK/El Clasico.webp'),
    ('DOZAJ BLACK', 'CHERRY CASH', '{cherry}', 'flavors/DOZAJ BLACK/CHERRY CASH.webp'),
    ('DOZAJ BLACK', 'MOROCCO', '{mint}', 'flavors/DOZAJ BLACK/MOROCCO.webp'),
    ('DOZAJ BLACK', 'MINT STORM', '{mint}', 'flavors/DOZAJ BLACK/MINT STORM.webp'),
    ('DOZAJ BLACK', 'KING OF NECTARINE', '{nectarine}', 'flavors/DOZAJ BLACK/KING OF NECTARINE.webp'),
    ('DOZAJ BLACK', 'MOSCOW ROSE', '{rose}', 'flavors/DOZAJ BLACK/MOSCOW ROSE.webp'),
    ('DOZAJ BLACK', 'HAVANA PURRO', '{tobacco}', 'flavors/DOZAJ BLACK/HAVANA PURRO.webp'),
    ('DOZAJ BLACK', 'BANGUM', '{candy}', 'flavors/DOZAJ BLACK/BANGUM.webp'),
    ('DOZAJ BLACK', 'FOREST BERRY', '{berry}', 'flavors/DOZAJ BLACK/FOREST BERRY.webp'),
    ('DOZAJ BLACK', 'SUMMER LOVE', '{mix}', 'flavors/DOZAJ BLACK/SUMMER LOVE.webp'),
    ('DOZAJ BLACK', 'MUCHO MANGO', '{mango}', 'flavors/DOZAJ BLACK/MUCHO MANGO.webp'),
    ('DOZAJ BLACK', 'CHOCOLATE HAZELNUT CREAM', '{chocolate,hazelnut,cream,nut}', 'flavors/DOZAJ BLACK/CHOCOLATE HAZELNUT CREAM.webp'),
    ('DOZAJ BLACK', 'COOKIE', '{dessert}', 'flavors/DOZAJ BLACK/COOKIE.webp'),
    ('DOZAJ BLACK', 'SUBZERO', '{ice}', 'flavors/DOZAJ BLACK/SUBZERO.webp'),
    ('DOZAJ BLACK', 'TEA TIME', '{tea}', 'flavors/DOZAJ BLACK/TEA TIME.webp'),
    ('DOZAJ BLACK', 'TIRAMISU', '{dessert}', 'flavors/DOZAJ BLACK/TIRAMISU.webp'),
    ('DOZAJ BLACK', 'Earl Grey', '{tea,bergamot,citrus}', 'flavors/DOZAJ BLACK/Earl Grey.webp'),
    ('DOZAJ BLACK', 'Darth Wader', '{mix}', 'flavors/DOZAJ BLACK/Darth Wader.webp'),
    ('DOZAJ BLACK', 'Bumboo', '{mix}', 'flavors/DOZAJ BLACK/Bumboo.webp'),
    ('DOZAJ BLACK', 'Black Queen', '{mix}', 'flavors/DOZAJ BLACK/Black Queen.webp'),
    ('DOZAJ BLACK', 'IRISH CREAM', '{cream}', 'flavors/DOZAJ BLACK/IRISH CREAM.webp'),
    ('DOZAJ BLACK', 'TROPICAL PEARL', '{tropical}', 'flavors/DOZAJ BLACK/TROPICAL PEARL.webp'),
    ('DOZAJ BLACK', 'RED CHOCOMINT', '{chocolate,mint}', 'flavors/DOZAJ BLACK/RED CHOCOMINT.webp'),
    ('DOZAJ BLACK', 'TANGERINE SODA', '{tangerine,citrus}', 'flavors/DOZAJ BLACK/TANGERINE SODA.webp')
) as v(brand_name, name, tags, image_path)
join public.brands b on b.name = v.brand_name
where f.brand_id = b.id
  and f.name = v.name;
