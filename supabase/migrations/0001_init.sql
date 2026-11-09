-- obedy-olomouc: initial schema
-- Run in Supabase SQL editor or `npx supabase db push`.

create extension if not exists postgis with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------- tables

create table public.restaurants (
  id            bigint generated always as identity primary key,
  osm_id        text unique,
  menicka_id    integer unique,
  slug          text not null unique,
  name          text not null,
  amenity       text not null default 'restaurant',
  lat           double precision not null,
  lon           double precision not null,
  geom          extensions.geography(Point, 4326)
                generated always as (extensions.st_setsrid(extensions.st_makepoint(lon, lat), 4326)::extensions.geography) stored,
  address       text,
  cuisine       text,
  opening_hours text,
  website       text,
  phone         text,
  updated_at    timestamptz not null default now()
);
create index restaurants_geom_idx on public.restaurants using gist (geom);

create table public.dishes (
  id            bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  name          text not null,
  name_norm     text not null,
  category      text not null default 'main' check (category in ('soup', 'main', 'dessert')),
  slug          text not null unique,
  created_at    timestamptz not null default now(),
  unique (restaurant_id, name_norm)
);

create table public.menus (
  id            bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  date          date not null,
  source        text not null check (source in ('menicka', 'ocr', 'user')),
  created_at    timestamptz not null default now(),
  unique (restaurant_id, date, source)
);

create table public.menu_items (
  menu_id  bigint not null references public.menus(id) on delete cascade,
  dish_id  bigint not null references public.dishes(id) on delete cascade,
  price    integer,
  position smallint not null default 0,
  primary key (menu_id, dish_id)
);

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text check (char_length(nickname) between 2 and 32),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id            bigint generated always as identity primary key,
  user_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  dish_id       bigint not null references public.dishes(id) on delete cascade,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  price_paid    integer check (price_paid between 0 and 2000),
  portion       smallint check (portion between 1 and 3),
  comment       text check (char_length(comment) <= 1000),
  review_date   date not null default (now() at time zone 'Europe/Prague')::date,
  created_at    timestamptz not null default now()
);
-- one review of a dish per user per day
create unique index reviews_user_dish_day on public.reviews (user_id, dish_id, review_date);
create index reviews_dish_idx on public.reviews (dish_id);
create index reviews_restaurant_idx on public.reviews (restaurant_id, created_at desc);

create table public.photos (
  id         bigint generated always as identity primary key,
  review_id  bigint not null references public.reviews(id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  path       text not null unique,
  width      integer,
  height     integer,
  ml_tags    jsonb,
  created_at timestamptz not null default now()
);
create index photos_review_idx on public.photos (review_id);

-- every auth user (incl. anonymous) gets a profile row
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------- abuse limits

create or replace function public.enforce_limits() returns trigger
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if tg_table_name = 'reviews' then
    -- restaurant_id must match the dish
    select d.restaurant_id into new.restaurant_id from dishes d where d.id = new.dish_id;
    select count(*) into n from reviews
      where user_id = new.user_id and created_at > now() - interval '24 hours';
    if n >= 30 then raise exception 'Limit 30 hodnocení za 24 hodin'; end if;
  elsif tg_table_name = 'photos' then
    select count(*) into n from photos
      where user_id = new.user_id and created_at > now() - interval '24 hours';
    if n >= 20 then raise exception 'Limit 20 fotek za 24 hodin'; end if;
    if not exists (select 1 from reviews r where r.id = new.review_id and r.user_id = new.user_id) then
      raise exception 'Fotka musí patřit k vlastnímu hodnocení';
    end if;
  end if;
  return new;
end $$;

create trigger reviews_limits before insert on public.reviews
  for each row execute function public.enforce_limits();
create trigger photos_limits before insert on public.photos
  for each row execute function public.enforce_limits();

-- ---------------------------------------------------------------- views

create view public.dish_scores with (security_invoker = true) as
select d.id as dish_id, d.restaurant_id,
       count(r.id)::int as n_reviews,
       round(avg(r.rating)::numeric, 2) as avg_rating
from public.dishes d
left join public.reviews r on r.dish_id = d.id
group by d.id;

create view public.restaurant_scores with (security_invoker = true) as
select rs.id as restaurant_id,
       count(r.id)::int as n_reviews,
       round(avg(r.rating)::numeric, 2) as avg_rating,
       count(r.id) filter (where r.created_at > now() - interval '30 days')::int as n_reviews_30d,
       round((avg(r.rating) filter (where r.created_at > now() - interval '30 days'))::numeric, 2) as avg_rating_30d
from public.restaurants rs
left join public.reviews r on r.restaurant_id = rs.id
group by rs.id;

create view public.today_menu_items with (security_invoker = true) as
select m.restaurant_id, m.date, m.source, mi.position, mi.price,
       d.id as dish_id, d.name, d.slug, d.category
from public.menus m
join public.menu_items mi on mi.menu_id = m.id
join public.dishes d on d.id = mi.dish_id
where m.date = (now() at time zone 'Europe/Prague')::date;

-- ---------------------------------------------------------------- RPC

create or replace function public.restaurants_within(p_lon double precision, p_lat double precision, p_meters double precision)
returns table (id bigint, slug text, name text, distance_m double precision)
language sql stable set search_path = public, extensions as $$
  select r.id, r.slug, r.name,
         st_distance(r.geom, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography) as distance_m
  from restaurants r
  where st_dwithin(r.geom, st_setsrid(st_makepoint(p_lon, p_lat), 4326)::geography, p_meters)
  order by distance_m;
$$;

create or replace function public.normalize_dish(p text) returns text
language sql immutable set search_path = public, extensions as $$
  select trim(regexp_replace(regexp_replace(lower(unaccent(p)), '\(.*?\)', ' ', 'g'), '[^a-z0-9]+', ' ', 'g'));
$$;

-- Upsert restaurants from the ETL (service role only).
create or replace function public.upsert_restaurants(p jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into restaurants (osm_id, menicka_id, slug, name, amenity, lat, lon, address, cuisine, opening_hours, website, phone)
  select x->>'osm_id', (x->>'menicka_id')::int, x->>'slug', x->>'name', coalesce(x->>'amenity', 'restaurant'),
         (x->>'lat')::float8, (x->>'lon')::float8, x->>'address', x->>'cuisine', x->>'opening_hours',
         x->>'website', x->>'phone'
  from jsonb_array_elements(p) x
  on conflict (slug) do update set
    osm_id = excluded.osm_id, menicka_id = excluded.menicka_id, name = excluded.name,
    amenity = excluded.amenity, lat = excluded.lat, lon = excluded.lon, address = excluded.address,
    cuisine = excluded.cuisine, opening_hours = excluded.opening_hours, website = excluded.website,
    phone = excluded.phone, updated_at = now();
  get diagnostics n = row_count;
  return n;
end $$;

-- Ingest one day of scraped menus: [{menicka_id, soups: [..], mains: [{name, price}]}]
create or replace function public.ingest_menus(p_date date, p_source text, p jsonb) returns integer
language plpgsql security definer set search_path = public, extensions as $$
declare
  x jsonb; it jsonb; rid bigint; rslug text; mid bigint; did bigint; pos int; n int := 0;
  dname text; dcat text; dprice int;
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
      insert into dishes (restaurant_id, name, name_norm, category, slug)
      values (rid, dname, normalize_dish(dname), dcat,
              left(rslug || '--' || trim(both '-' from regexp_replace(lower(unaccent(dname)), '[^a-z0-9]+', '-', 'g')), 120))
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

revoke execute on function public.upsert_restaurants(jsonb) from public, anon, authenticated;
revoke execute on function public.ingest_menus(date, text, jsonb) from public, anon, authenticated;

-- ---------------------------------------------------------------- Data API grants
-- (project created with "Automatically expose new tables" OFF, so grant explicitly)

grant usage on schema public to anon, authenticated, service_role;

grant select on public.restaurants, public.dishes, public.menus, public.menu_items,
  public.profiles, public.reviews, public.photos,
  public.dish_scores, public.restaurant_scores, public.today_menu_items
  to anon, authenticated;
grant update (nickname) on public.profiles to authenticated;
grant insert (dish_id, restaurant_id, rating, price_paid, portion, comment) on public.reviews to authenticated;
grant update (rating, price_paid, portion, comment) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;
grant insert (review_id, path, width, height) on public.photos to authenticated;
grant delete on public.photos to authenticated;
grant all on all tables in schema public to service_role;

grant execute on function public.restaurants_within(double precision, double precision, double precision) to anon, authenticated;
revoke execute on function public.enforce_limits() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.upsert_restaurants(jsonb) to service_role;
grant execute on function public.ingest_menus(date, text, jsonb) to service_role;

-- ---------------------------------------------------------------- RLS

alter table public.restaurants enable row level security;
alter table public.dishes      enable row level security;
alter table public.menus       enable row level security;
alter table public.menu_items  enable row level security;
alter table public.profiles    enable row level security;
alter table public.reviews     enable row level security;
alter table public.photos      enable row level security;

create policy "public read" on public.restaurants for select using (true);
create policy "public read" on public.dishes      for select using (true);
create policy "public read" on public.menus       for select using (true);
create policy "public read" on public.menu_items  for select using (true);
create policy "public read" on public.profiles    for select using (true);
create policy "public read" on public.reviews     for select using (true);
create policy "public read" on public.photos      for select using (true);

create policy "own profile" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile upd" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own review" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "own review upd" on public.reviews for update to authenticated using (user_id = auth.uid());
create policy "own review del" on public.reviews for delete to authenticated using (user_id = auth.uid());
create policy "own photo" on public.photos for insert to authenticated with check (user_id = auth.uid());
create policy "own photo del" on public.photos for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------- storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 3145728, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

create policy "photos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "photos delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
