update public.flavors
set created_by = null
where brand_id = (select id from public.brands where name = 'Starline')
  and created_by is not null;

update public.flavors
set image_path = 'flavors/Starline/' || name || '.webp'
where brand_id = (select id from public.brands where name = 'Starline')
  and name in (
    'STRAWBERRY MILLEFEUILLE',
    'PAPAYA',
    'ORANGINA',
    'NECTARINE',
    'LEMON FIZZ',
    'FREE CUBA',
    'BLUEBERRY CRUMBLE',
    'BERRY POPCORN',
    'BELGIAN WAFFLE',
    'APPLE JUICE'
  )
  and image_path is distinct from ('flavors/Starline/' || name || '.webp');
