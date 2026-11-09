-- Dish slugs are cut to 120 chars, so two long names can map to the same slug.
-- On a collision with a different dish, append a short hash of the name.

create or replace function public.ingest_menus(p_date date, p_source text, p jsonb) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare
  x jsonb; it jsonb; rid bigint; rslug text; mid bigint; did bigint; pos int; n int := 0;
  dname text; dnorm text; dslug text; dcat text; dprice int;
begin
  for x in select * from jsonb_array_elements(p) loop
    select id, slug into rid, rslug from restaurants where menicka_id = (x->>'menicka_id')::int;
    continue when rid is null;
    insert into menus (restaurant_id, date, source) values (rid, p_date, p_source)
      on conflict (restaurant_id, date, source) do update set created_at = now()
      returning id into mid;
    delete from menu_items where menu_id = mid;
    pos := 0;
    for it in
      select jsonb_build_object('name', s, 'cat', 'soup') from jsonb_array_elements_text(coalesce(x->'soups', '[]')) s
      union all
      select jsonb_build_object('name', m->>'name', 'price', m->'price', 'cat', 'main') from jsonb_array_elements(coalesce(x->'mains', '[]')) m
    loop
      dname := it->>'name'; dcat := it->>'cat';
      dprice := nullif(it->>'price', 'null')::int;
      dnorm := normalize_dish(dname);
      dslug := left(rslug || '--' || trim(both '-' from regexp_replace(lower(unaccent(dname)), '[^a-z0-9]+', '-', 'g')), 120);
      if exists (select 1 from dishes d where d.slug = dslug and not (d.restaurant_id = rid and d.name_norm = dnorm)) then
        dslug := left(dslug, 113) || '-' || left(md5(dnorm), 6);
      end if;
      insert into dishes (restaurant_id, name, name_norm, category, slug)
      values (rid, dname, dnorm, dcat, dslug)
      on conflict (restaurant_id, name_norm) do update set name = excluded.name
      returning id into did;
      pos := pos + 1;
      insert into menu_items (menu_id, dish_id, price, position) values (mid, did, dprice, pos)
        on conflict do nothing;
      n := n + 1;
    end loop;
  end loop;
  return n;
end $$;

revoke execute on function public.ingest_menus(date, text, jsonb) from public, anon, authenticated;
grant execute on function public.ingest_menus(date, text, jsonb) to service_role;
