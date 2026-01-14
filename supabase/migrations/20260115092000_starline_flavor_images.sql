update public.flavors
set image_path = 'STRAWBERRY MILLEFEUILLE.webp'
where name = 'STRAWBERRY MILLEFEUILLE'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'PAPAYA.webp'
where name = 'PAPAYA'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'ORANGINA.webp'
where name = 'ORANGINA'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'NECTARINE.webp'
where name = 'NECTARINE'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'LEMON FIZZ.webp'
where name = 'LEMON FIZZ'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'FREE CUBA.webp'
where name = 'FREE CUBA'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'BLUEBERRY CRUMBLE.webp'
where name = 'BLUEBERRY CRUMBLE'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'BERRY POPCORN.webp'
where name = 'BERRY POPCORN'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'BELGIAN WAFFLE.webp'
where name = 'BELGIAN WAFFLE'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;

update public.flavors
set image_path = 'APPLE JUICE.webp'
where name = 'APPLE JUICE'
  and brand_id = (select id from public.brands where name = 'Starline')
  and image_path is null;
