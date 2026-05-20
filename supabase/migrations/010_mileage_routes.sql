-- =============================================================
-- MILEAGE ROUTES — saved regular journeys for one-click selection
-- in the mileage form.
-- =============================================================

create table if not exists public.mileage_routes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text,
  from_place   text not null,
  to_place     text not null,
  miles        numeric(8,2) not null check (miles >= 0),
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists mileage_routes_user_id_idx on public.mileage_routes(user_id);
create index if not exists mileage_routes_sort_idx    on public.mileage_routes(user_id, sort_order, name);

drop trigger if exists mileage_routes_touch on public.mileage_routes;
create trigger mileage_routes_touch before update on public.mileage_routes
  for each row execute function public.touch_updated_at();

alter table public.mileage_routes enable row level security;

drop policy if exists "mileage_routes_select_own" on public.mileage_routes;
drop policy if exists "mileage_routes_insert_own" on public.mileage_routes;
drop policy if exists "mileage_routes_update_own" on public.mileage_routes;
drop policy if exists "mileage_routes_delete_own" on public.mileage_routes;

create policy "mileage_routes_select_own" on public.mileage_routes for select using (auth.uid() = user_id);
create policy "mileage_routes_insert_own" on public.mileage_routes for insert with check (auth.uid() = user_id);
create policy "mileage_routes_update_own" on public.mileage_routes for update using (auth.uid() = user_id);
create policy "mileage_routes_delete_own" on public.mileage_routes for delete using (auth.uid() = user_id);
