insert into public.brands (name, jp_available)
values ('DOZAJ', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
    ('DOZAJ', 'ACAI', '{berry}', 'flavors/DOZAJ/ACAI.webp'),
    ('DOZAJ', 'ALMOND', '{nut}', 'flavors/DOZAJ/ALMOND.webp'),
    ('DOZAJ', 'BANANA', '{banana}', 'flavors/DOZAJ/BANANA.webp'),
    ('DOZAJ', 'BERGAMOT TEA', '{tea,citrus,bergamot}', 'flavors/DOZAJ/BERGAMOT TEA.webp'),
    ('DOZAJ', 'BISCUIT', '{dessert}', 'flavors/DOZAJ/BISCUIT.webp'),
    ('DOZAJ', 'BLACK CURRANT', '{currant,berry}', 'flavors/DOZAJ/BLACK CURRANT.webp'),
    ('DOZAJ', 'BLACK TEA', '{tea}', 'flavors/DOZAJ/BLACK TEA.webp'),
    ('DOZAJ', 'BUTTER', '{butter}', 'flavors/DOZAJ/BUTTER.webp'),
    ('DOZAJ', 'CACTUS', '{cactus}', 'flavors/DOZAJ/CACTUS.webp'),
    ('DOZAJ', 'CARAMEL', '{caramel}', 'flavors/DOZAJ/CARAMEL.webp'),
    ('DOZAJ', 'CARDAMON', '{spice}', 'flavors/DOZAJ/CARDAMON.webp'),
    ('DOZAJ', 'CHOCOLATE', '{chocolate}', 'flavors/DOZAJ/CHOCOLATE.webp'),
    ('DOZAJ', 'CINNAMON', '{cinnamon,spice}', 'flavors/DOZAJ/CINNAMON.webp'),
    ('DOZAJ', 'COTTON CANDY', '{candy}', 'flavors/DOZAJ/COTTON CANDY.webp'),
    ('DOZAJ', 'DEAD SEA', '{mix}', 'flavors/DOZAJ/DEAD SEA.webp'),
    ('DOZAJ', 'DRAGON FRUIT', '{dragon fruit}', 'flavors/DOZAJ/DRAGON FRUIT.webp'),
    ('DOZAJ', 'ETERNAL', '{mix}', 'flavors/DOZAJ/ETERNAL.webp'),
    ('DOZAJ', 'GREEN MIX', '{mix}', 'flavors/DOZAJ/GREEN MIX.webp'),
    ('DOZAJ', 'GREEN TEA', '{tea}', 'flavors/DOZAJ/GREEN TEA.webp'),
    ('DOZAJ', 'HONEY', '{honey}', 'flavors/DOZAJ/HONEY.webp'),
    ('DOZAJ', 'ICE', '{ice}', 'flavors/DOZAJ/ICE.webp'),
    ('DOZAJ', 'ICE CREAM LEMON', '{lemon,ice,cream}', 'flavors/DOZAJ/ICE CREAM LEMON.webp'),
    ('DOZAJ', 'JASMINE', '{jasmine}', 'flavors/DOZAJ/JASMINE.webp'),
    ('DOZAJ', 'KASHMIR', '{spice}', 'flavors/DOZAJ/KASHMIR.webp'),
    ('DOZAJ', 'LEMON', '{lemon,citrus}', 'flavors/DOZAJ/LEMON.webp'),
    ('DOZAJ', 'LIME', '{lime,citrus}', 'flavors/DOZAJ/LIME.webp'),
    ('DOZAJ', 'LINDEN TEA', '{tea,herbal,linden}', 'flavors/DOZAJ/LINDEN TEA.webp'),
    ('DOZAJ', 'MACARON PINK', '{dessert}', 'flavors/DOZAJ/MACARON PINK.webp'),
    ('DOZAJ', 'MILK', '{milk}', 'flavors/DOZAJ/MILK.webp'),
    ('DOZAJ', 'NESQUICKLY', '{chocolate}', 'flavors/DOZAJ/NESQUICKLY.webp'),
    ('DOZAJ', 'PASSION FRUIT', '{passion fruit}', 'flavors/DOZAJ/PASSION FRUIT.webp'),
    ('DOZAJ', 'PEANUT BUTTER', '{peanut,nut}', 'flavors/DOZAJ/PEANUT BUTTER.webp'),
    ('DOZAJ', 'PEAR', '{pear}', 'flavors/DOZAJ/PEAR.webp'),
    ('DOZAJ', 'PINEAPPLE', '{pineapple}', 'flavors/DOZAJ/PINEAPPLE.webp'),
    ('DOZAJ', 'PINK LEMONADE', '{lemon,citrus}', 'flavors/DOZAJ/PINK LEMONADE.webp'),
    ('DOZAJ', 'PISTACHIO', '{pistachio,nut}', 'flavors/DOZAJ/PISTACHIO.webp'),
    ('DOZAJ', 'POMEGRANDE YOGURT', '{pomegranate,yogurt}', 'flavors/DOZAJ/POMEGRANDE YOGURT.webp'),
    ('DOZAJ', 'POPCORN', '{popcorn}', 'flavors/DOZAJ/POPCORN.webp'),
    ('DOZAJ', 'SESAME', '{sesame}', 'flavors/DOZAJ/SESAME.webp'),
    ('DOZAJ', 'STRAWBERRY', '{strawberry}', 'flavors/DOZAJ/STRAWBERRY.webp')
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
    ('DOZAJ', 'ACAI', '{berry}', 'flavors/DOZAJ/ACAI.webp'),
    ('DOZAJ', 'ALMOND', '{nut}', 'flavors/DOZAJ/ALMOND.webp'),
    ('DOZAJ', 'BANANA', '{banana}', 'flavors/DOZAJ/BANANA.webp'),
    ('DOZAJ', 'BERGAMOT TEA', '{tea,citrus,bergamot}', 'flavors/DOZAJ/BERGAMOT TEA.webp'),
    ('DOZAJ', 'BISCUIT', '{dessert}', 'flavors/DOZAJ/BISCUIT.webp'),
    ('DOZAJ', 'BLACK CURRANT', '{currant,berry}', 'flavors/DOZAJ/BLACK CURRANT.webp'),
    ('DOZAJ', 'BLACK TEA', '{tea}', 'flavors/DOZAJ/BLACK TEA.webp'),
    ('DOZAJ', 'BUTTER', '{butter}', 'flavors/DOZAJ/BUTTER.webp'),
    ('DOZAJ', 'CACTUS', '{cactus}', 'flavors/DOZAJ/CACTUS.webp'),
    ('DOZAJ', 'CARAMEL', '{caramel}', 'flavors/DOZAJ/CARAMEL.webp'),
    ('DOZAJ', 'CARDAMON', '{spice}', 'flavors/DOZAJ/CARDAMON.webp'),
    ('DOZAJ', 'CHOCOLATE', '{chocolate}', 'flavors/DOZAJ/CHOCOLATE.webp'),
    ('DOZAJ', 'CINNAMON', '{cinnamon,spice}', 'flavors/DOZAJ/CINNAMON.webp'),
    ('DOZAJ', 'COTTON CANDY', '{candy}', 'flavors/DOZAJ/COTTON CANDY.webp'),
    ('DOZAJ', 'DEAD SEA', '{mix}', 'flavors/DOZAJ/DEAD SEA.webp'),
    ('DOZAJ', 'DRAGON FRUIT', '{dragon fruit}', 'flavors/DOZAJ/DRAGON FRUIT.webp'),
    ('DOZAJ', 'ETERNAL', '{mix}', 'flavors/DOZAJ/ETERNAL.webp'),
    ('DOZAJ', 'GREEN MIX', '{mix}', 'flavors/DOZAJ/GREEN MIX.webp'),
    ('DOZAJ', 'GREEN TEA', '{tea}', 'flavors/DOZAJ/GREEN TEA.webp'),
    ('DOZAJ', 'HONEY', '{honey}', 'flavors/DOZAJ/HONEY.webp'),
    ('DOZAJ', 'ICE', '{ice}', 'flavors/DOZAJ/ICE.webp'),
    ('DOZAJ', 'ICE CREAM LEMON', '{lemon,ice,cream}', 'flavors/DOZAJ/ICE CREAM LEMON.webp'),
    ('DOZAJ', 'JASMINE', '{jasmine}', 'flavors/DOZAJ/JASMINE.webp'),
    ('DOZAJ', 'KASHMIR', '{spice}', 'flavors/DOZAJ/KASHMIR.webp'),
    ('DOZAJ', 'LEMON', '{lemon,citrus}', 'flavors/DOZAJ/LEMON.webp'),
    ('DOZAJ', 'LIME', '{lime,citrus}', 'flavors/DOZAJ/LIME.webp'),
    ('DOZAJ', 'LINDEN TEA', '{tea,herbal,linden}', 'flavors/DOZAJ/LINDEN TEA.webp'),
    ('DOZAJ', 'MACARON PINK', '{dessert}', 'flavors/DOZAJ/MACARON PINK.webp'),
    ('DOZAJ', 'MILK', '{milk}', 'flavors/DOZAJ/MILK.webp'),
    ('DOZAJ', 'NESQUICKLY', '{chocolate}', 'flavors/DOZAJ/NESQUICKLY.webp'),
    ('DOZAJ', 'PASSION FRUIT', '{passion fruit}', 'flavors/DOZAJ/PASSION FRUIT.webp'),
    ('DOZAJ', 'PEANUT BUTTER', '{peanut,nut}', 'flavors/DOZAJ/PEANUT BUTTER.webp'),
    ('DOZAJ', 'PEAR', '{pear}', 'flavors/DOZAJ/PEAR.webp'),
    ('DOZAJ', 'PINEAPPLE', '{pineapple}', 'flavors/DOZAJ/PINEAPPLE.webp'),
    ('DOZAJ', 'PINK LEMONADE', '{lemon,citrus}', 'flavors/DOZAJ/PINK LEMONADE.webp'),
    ('DOZAJ', 'PISTACHIO', '{pistachio,nut}', 'flavors/DOZAJ/PISTACHIO.webp'),
    ('DOZAJ', 'POMEGRANDE YOGURT', '{pomegranate,yogurt}', 'flavors/DOZAJ/POMEGRANDE YOGURT.webp'),
    ('DOZAJ', 'POPCORN', '{popcorn}', 'flavors/DOZAJ/POPCORN.webp'),
    ('DOZAJ', 'SESAME', '{sesame}', 'flavors/DOZAJ/SESAME.webp'),
    ('DOZAJ', 'STRAWBERRY', '{strawberry}', 'flavors/DOZAJ/STRAWBERRY.webp')
) as v(brand_name, name, tags, image_path)
join public.brands b on b.name = v.brand_name
where f.brand_id = b.id
  and f.name = v.name;
