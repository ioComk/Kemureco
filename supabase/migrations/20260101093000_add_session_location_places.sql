alter table public.sessions
  add column if not exists location_place_id text,
  add column if not exists location_name text,
  add column if not exists location_address text,
  add column if not exists location_lat double precision,
  add column if not exists location_lng double precision,
  add column if not exists location_distance_km double precision;
