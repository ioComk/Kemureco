insert into public.brands (name, jp_available)
values ('Afzal', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
    ('Afzal', 'CHOCOCRACKLE', '{chocolate,dessert}', 'flavors/Afzal/CHOCOCRACKLE.webp'),
    ('Afzal', 'Plum', '{plum}', 'flavors/Afzal/Plum.webp'),
    ('Afzal', 'PassionFruit', '{passion fruit}', 'flavors/Afzal/PassionFruit.webp'),
    ('Afzal', 'Pan Masala', '{spice}', 'flavors/Afzal/Pan Masala.webp'),
    ('Afzal', 'Lime Lemon', '{lime,lemon,citrus}', 'flavors/Afzal/Lime Lemon.webp'),
    ('Afzal', 'Lemon Grass', '{lemon,citrus,lemongrass,herbal}', 'flavors/Afzal/Lemon Grass.webp'),
    ('Afzal', 'Lebanese Bomshell', '{mix}', 'flavors/Afzal/Lebanese Bomshell.webp'),
    ('Afzal', 'Jasmine', '{jasmine,floral}', 'flavors/Afzal/Jasmine.webp'),
    ('Afzal', 'HazelnutCreamWaffle', '{hazelnut,cream,waffle,nut,dessert}', 'flavors/Afzal/HazelnutCreamWaffle.webp'),
    ('Afzal', 'CreamCaramel', '{caramel,cream,dessert}', 'flavors/Afzal/CreamCaramel.webp'),
    ('Afzal', 'Berry Blast', '{berry}', 'flavors/Afzal/Berry Blast.webp'),
    ('Afzal', 'MangoLassi', '{mango,milk}', 'flavors/Afzal/MangoLassi.webp'),
    ('Afzal', 'Choco Hazel', '{chocolate,hazelnut,nut}', 'flavors/Afzal/Choco Hazel.webp'),
    ('Afzal', 'IcyLemonTea', '{lemon,tea,ice}', 'flavors/Afzal/IcyLemonTea.webp'),
    ('Afzal', 'CocoLemonade', '{coconut,lemon,citrus}', 'flavors/Afzal/CocoLemonade.webp'),
    ('Afzal', 'IcyMint', '{mint,ice}', 'flavors/Afzal/IcyMint.webp'),
    ('Afzal', 'IcyGrapefruits', '{grapefruit,citrus,ice}', 'flavors/Afzal/IcyGrapefruits.webp'),
    ('Afzal', 'RedCherry', '{cherry}', 'flavors/Afzal/RedCherry.webp'),
    ('Afzal', 'MangoSalsa', '{mango}', 'flavors/Afzal/MangoSalsa.webp'),
    ('Afzal', 'LemonFizz', '{lemon,citrus}', 'flavors/Afzal/LemonFizz.webp'),
    ('Afzal', 'SweetCone', '{dessert}', 'flavors/Afzal/SweetCone.webp'),
    ('Afzal', 'Kiwi', '{kiwi}', 'flavors/Afzal/Kiwi.webp'),
    ('Afzal', 'SpecialPan', '{spice}', 'flavors/Afzal/SpecialPan.webp'),
    ('Afzal', 'PanRaas', '{spice}', 'flavors/Afzal/PanRaas.webp'),
    ('Afzal', 'LemonTea', '{lemon,tea}', 'flavors/Afzal/LemonTea.webp'),
    ('Afzal', 'Gingerale', '{ginger}', 'flavors/Afzal/Gingerale.webp'),
    ('Afzal', 'Asai Berry', '{acai,berry}', 'flavors/Afzal/Asai Berry.webp'),
    ('Afzal', 'Lychee', '{lychee}', 'flavors/Afzal/Lychee.webp'),
    ('Afzal', 'Earlgrey', '{tea,bergamot,citrus}', 'flavors/Afzal/Earlgrey.webp')
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
    ('Afzal', 'CHOCOCRACKLE', '{chocolate,dessert}', 'flavors/Afzal/CHOCOCRACKLE.webp'),
    ('Afzal', 'Plum', '{plum}', 'flavors/Afzal/Plum.webp'),
    ('Afzal', 'PassionFruit', '{passion fruit}', 'flavors/Afzal/PassionFruit.webp'),
    ('Afzal', 'Pan Masala', '{spice}', 'flavors/Afzal/Pan Masala.webp'),
    ('Afzal', 'Lime Lemon', '{lime,lemon,citrus}', 'flavors/Afzal/Lime Lemon.webp'),
    ('Afzal', 'Lemon Grass', '{lemon,citrus,lemongrass,herbal}', 'flavors/Afzal/Lemon Grass.webp'),
    ('Afzal', 'Lebanese Bomshell', '{mix}', 'flavors/Afzal/Lebanese Bomshell.webp'),
    ('Afzal', 'Jasmine', '{jasmine,floral}', 'flavors/Afzal/Jasmine.webp'),
    ('Afzal', 'HazelnutCreamWaffle', '{hazelnut,cream,waffle,nut,dessert}', 'flavors/Afzal/HazelnutCreamWaffle.webp'),
    ('Afzal', 'CreamCaramel', '{caramel,cream,dessert}', 'flavors/Afzal/CreamCaramel.webp'),
    ('Afzal', 'Berry Blast', '{berry}', 'flavors/Afzal/Berry Blast.webp'),
    ('Afzal', 'MangoLassi', '{mango,milk}', 'flavors/Afzal/MangoLassi.webp'),
    ('Afzal', 'Choco Hazel', '{chocolate,hazelnut,nut}', 'flavors/Afzal/Choco Hazel.webp'),
    ('Afzal', 'IcyLemonTea', '{lemon,tea,ice}', 'flavors/Afzal/IcyLemonTea.webp'),
    ('Afzal', 'CocoLemonade', '{coconut,lemon,citrus}', 'flavors/Afzal/CocoLemonade.webp'),
    ('Afzal', 'IcyMint', '{mint,ice}', 'flavors/Afzal/IcyMint.webp'),
    ('Afzal', 'IcyGrapefruits', '{grapefruit,citrus,ice}', 'flavors/Afzal/IcyGrapefruits.webp'),
    ('Afzal', 'RedCherry', '{cherry}', 'flavors/Afzal/RedCherry.webp'),
    ('Afzal', 'MangoSalsa', '{mango}', 'flavors/Afzal/MangoSalsa.webp'),
    ('Afzal', 'LemonFizz', '{lemon,citrus}', 'flavors/Afzal/LemonFizz.webp'),
    ('Afzal', 'SweetCone', '{dessert}', 'flavors/Afzal/SweetCone.webp'),
    ('Afzal', 'Kiwi', '{kiwi}', 'flavors/Afzal/Kiwi.webp'),
    ('Afzal', 'SpecialPan', '{spice}', 'flavors/Afzal/SpecialPan.webp'),
    ('Afzal', 'PanRaas', '{spice}', 'flavors/Afzal/PanRaas.webp'),
    ('Afzal', 'LemonTea', '{lemon,tea}', 'flavors/Afzal/LemonTea.webp'),
    ('Afzal', 'Gingerale', '{ginger}', 'flavors/Afzal/Gingerale.webp'),
    ('Afzal', 'Asai Berry', '{acai,berry}', 'flavors/Afzal/Asai Berry.webp'),
    ('Afzal', 'Lychee', '{lychee}', 'flavors/Afzal/Lychee.webp'),
    ('Afzal', 'Earlgrey', '{tea,bergamot,citrus}', 'flavors/Afzal/Earlgrey.webp')
) as v(brand_name, name, tags, image_path)
join public.brands b on b.name = v.brand_name
where f.brand_id = b.id
  and f.name = v.name;
