do $$
declare
  old_id integer;
  new_id integer;
begin
  select id into old_id from public.brands where name = 'Al Fakher';
  select id into new_id from public.brands where name = 'AL Fakher';

  if new_id is null then
    if old_id is not null then
      update public.brands set name = 'AL Fakher' where id = old_id;
    else
      insert into public.brands (name, jp_available) values ('AL Fakher', true);
    end if;
  else
    if old_id is not null and old_id <> new_id then
      update public.flavors set brand_id = new_id where brand_id = old_id;
      delete from public.brands where id = old_id;
    end if;
    update public.brands set jp_available = true where id = new_id;
  end if;
end $$;
