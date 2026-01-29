insert into public.brands (name, jp_available)
values ('SEBERO BLACK', true)
on conflict (name) do update set jp_available = excluded.jp_available;

insert into public.flavors (brand_id, name, tags, image_path, created_by)
select b.id, f.name, f.tags::text[], f.image_path, null
from (
  values
    ('SEBERO BLACK', 'Amarena Cherry', '{cherry}', 'flavors/SEBERO BLACK/Amarena Cherry.webp'),
    ('SEBERO BLACK', 'Apple Juice', '{apple}', 'flavors/SEBERO BLACK/Apple Juice.webp'),
    ('SEBERO BLACK', 'Barberry', '{barberry,berry}', 'flavors/SEBERO BLACK/Barberry.webp'),
    ('SEBERO BLACK', 'Bilberry', '{bilberry,berry}', 'flavors/SEBERO BLACK/Bilberry.webp'),
    ('SEBERO BLACK', 'Bluebery', '{blueberry,berry}', 'flavors/SEBERO BLACK/Bluebery.webp'),
    ('SEBERO BLACK', 'Bubble gum', '{candy}', 'flavors/SEBERO BLACK/Bubble gum.webp'),
    ('SEBERO BLACK', 'Cactus', '{cactus}', 'flavors/SEBERO BLACK/Cactus.webp'),
    ('SEBERO BLACK', 'Cola', '{cola}', 'flavors/SEBERO BLACK/Cola.webp'),
    ('SEBERO BLACK', 'Cookie Monster', '{dessert}', 'flavors/SEBERO BLACK/Cookie Monster.webp'),
    ('SEBERO BLACK', 'Feijoa', '{feijoa}', 'flavors/SEBERO BLACK/Feijoa.webp'),
    ('SEBERO BLACK', 'Garnet', '{pomegranate}', 'flavors/SEBERO BLACK/Garnet.webp'),
    ('SEBERO BLACK', 'Grape', '{grape}', 'flavors/SEBERO BLACK/Grape.webp'),
    ('SEBERO BLACK', 'Grapefruit', '{grapefruit,citrus}', 'flavors/SEBERO BLACK/Grapefruit.webp'),
    ('SEBERO BLACK', 'Green pear', '{pear}', 'flavors/SEBERO BLACK/Green pear.webp'),
    ('SEBERO BLACK', 'Herbal Currant', '{currant,berry,herbal}', 'flavors/SEBERO BLACK/Herbal Currant.webp'),
    ('SEBERO BLACK', 'Kiwi', '{kiwi}', 'flavors/SEBERO BLACK/Kiwi.webp'),
    ('SEBERO BLACK', 'Lemon Bomb', '{lemon,citrus}', 'flavors/SEBERO BLACK/Lemon Bomb.webp'),
    ('SEBERO BLACK', 'Lemon Candy', '{lemon,candy}', 'flavors/SEBERO BLACK/Lemon Candy.webp'),
    ('SEBERO BLACK', 'Lemon Waffle', '{lemon,dessert}', 'flavors/SEBERO BLACK/Lemon Waffle.webp'),
    ('SEBERO BLACK', 'Limonchello', '{lemon,citrus}', 'flavors/SEBERO BLACK/Limonchello.webp'),
    ('SEBERO BLACK', 'Mango Yogurt', '{mango,yogurt}', 'flavors/SEBERO BLACK/Mango Yogurt.webp'),
    ('SEBERO BLACK', 'Mellow Mango', '{mango}', 'flavors/SEBERO BLACK/Mellow Mango.webp'),
    ('SEBERO BLACK', 'Mint', '{mint}', 'flavors/SEBERO BLACK/Mint.webp'),
    ('SEBERO BLACK', 'Nitro', '{mix}', 'flavors/SEBERO BLACK/Nitro.webp'),
    ('SEBERO BLACK', 'Prunes', '{prune}', 'flavors/SEBERO BLACK/Prunes.webp'),
    ('SEBERO BLACK', 'Raspberry', '{raspberry}', 'flavors/SEBERO BLACK/Raspberry.webp'),
    ('SEBERO BLACK', 'Root Beer', '{root beer}', 'flavors/SEBERO BLACK/Root Beer.webp'),
    ('SEBERO BLACK', 'Sourness', '{citrus}', 'flavors/SEBERO BLACK/Sourness.webp'),
    ('SEBERO BLACK', 'Strawberry', '{strawberry}', 'flavors/SEBERO BLACK/Strawberry.webp'),
    ('SEBERO BLACK', 'Strawberry-Guava', '{strawberry,guava}', 'flavors/SEBERO BLACK/Strawberry-Guava.webp'),
    ('SEBERO BLACK', 'Strawberry-banana', '{strawberry,banana}', 'flavors/SEBERO BLACK/Strawberry-banana.webp'),
    ('SEBERO BLACK', 'TOP', '{mix}', 'flavors/SEBERO BLACK/TOP.webp'),
    ('SEBERO BLACK', 'Watermelon', '{watermelon}', 'flavors/SEBERO BLACK/Watermelon.webp'),
    ('SEBERO BLACK', 'Western', '{mix}', 'flavors/SEBERO BLACK/Western.webp'),
    ('SEBERO BLACK', 'Wild Berries', '{berry}', 'flavors/SEBERO BLACK/Wild Berries.webp')
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
    ('SEBERO BLACK', 'Amarena Cherry', '{cherry}', 'flavors/SEBERO BLACK/Amarena Cherry.webp'),
    ('SEBERO BLACK', 'Apple Juice', '{apple}', 'flavors/SEBERO BLACK/Apple Juice.webp'),
    ('SEBERO BLACK', 'Barberry', '{barberry,berry}', 'flavors/SEBERO BLACK/Barberry.webp'),
    ('SEBERO BLACK', 'Bilberry', '{bilberry,berry}', 'flavors/SEBERO BLACK/Bilberry.webp'),
    ('SEBERO BLACK', 'Bluebery', '{blueberry,berry}', 'flavors/SEBERO BLACK/Bluebery.webp'),
    ('SEBERO BLACK', 'Bubble gum', '{candy}', 'flavors/SEBERO BLACK/Bubble gum.webp'),
    ('SEBERO BLACK', 'Cactus', '{cactus}', 'flavors/SEBERO BLACK/Cactus.webp'),
    ('SEBERO BLACK', 'Cola', '{cola}', 'flavors/SEBERO BLACK/Cola.webp'),
    ('SEBERO BLACK', 'Cookie Monster', '{dessert}', 'flavors/SEBERO BLACK/Cookie Monster.webp'),
    ('SEBERO BLACK', 'Feijoa', '{feijoa}', 'flavors/SEBERO BLACK/Feijoa.webp'),
    ('SEBERO BLACK', 'Garnet', '{pomegranate}', 'flavors/SEBERO BLACK/Garnet.webp'),
    ('SEBERO BLACK', 'Grape', '{grape}', 'flavors/SEBERO BLACK/Grape.webp'),
    ('SEBERO BLACK', 'Grapefruit', '{grapefruit,citrus}', 'flavors/SEBERO BLACK/Grapefruit.webp'),
    ('SEBERO BLACK', 'Green pear', '{pear}', 'flavors/SEBERO BLACK/Green pear.webp'),
    ('SEBERO BLACK', 'Herbal Currant', '{currant,berry,herbal}', 'flavors/SEBERO BLACK/Herbal Currant.webp'),
    ('SEBERO BLACK', 'Kiwi', '{kiwi}', 'flavors/SEBERO BLACK/Kiwi.webp'),
    ('SEBERO BLACK', 'Lemon Bomb', '{lemon,citrus}', 'flavors/SEBERO BLACK/Lemon Bomb.webp'),
    ('SEBERO BLACK', 'Lemon Candy', '{lemon,candy}', 'flavors/SEBERO BLACK/Lemon Candy.webp'),
    ('SEBERO BLACK', 'Lemon Waffle', '{lemon,dessert}', 'flavors/SEBERO BLACK/Lemon Waffle.webp'),
    ('SEBERO BLACK', 'Limonchello', '{lemon,citrus}', 'flavors/SEBERO BLACK/Limonchello.webp'),
    ('SEBERO BLACK', 'Mango Yogurt', '{mango,yogurt}', 'flavors/SEBERO BLACK/Mango Yogurt.webp'),
    ('SEBERO BLACK', 'Mellow Mango', '{mango}', 'flavors/SEBERO BLACK/Mellow Mango.webp'),
    ('SEBERO BLACK', 'Mint', '{mint}', 'flavors/SEBERO BLACK/Mint.webp'),
    ('SEBERO BLACK', 'Nitro', '{mix}', 'flavors/SEBERO BLACK/Nitro.webp'),
    ('SEBERO BLACK', 'Prunes', '{prune}', 'flavors/SEBERO BLACK/Prunes.webp'),
    ('SEBERO BLACK', 'Raspberry', '{raspberry}', 'flavors/SEBERO BLACK/Raspberry.webp'),
    ('SEBERO BLACK', 'Root Beer', '{root beer}', 'flavors/SEBERO BLACK/Root Beer.webp'),
    ('SEBERO BLACK', 'Sourness', '{citrus}', 'flavors/SEBERO BLACK/Sourness.webp'),
    ('SEBERO BLACK', 'Strawberry', '{strawberry}', 'flavors/SEBERO BLACK/Strawberry.webp'),
    ('SEBERO BLACK', 'Strawberry-Guava', '{strawberry,guava}', 'flavors/SEBERO BLACK/Strawberry-Guava.webp'),
    ('SEBERO BLACK', 'Strawberry-banana', '{strawberry,banana}', 'flavors/SEBERO BLACK/Strawberry-banana.webp'),
    ('SEBERO BLACK', 'TOP', '{mix}', 'flavors/SEBERO BLACK/TOP.webp'),
    ('SEBERO BLACK', 'Watermelon', '{watermelon}', 'flavors/SEBERO BLACK/Watermelon.webp'),
    ('SEBERO BLACK', 'Western', '{mix}', 'flavors/SEBERO BLACK/Western.webp'),
    ('SEBERO BLACK', 'Wild Berries', '{berry}', 'flavors/SEBERO BLACK/Wild Berries.webp')
) as v(brand_name, name, tags, image_path)
join public.brands b on b.name = v.brand_name
where f.brand_id = b.id
  and f.name = v.name;
