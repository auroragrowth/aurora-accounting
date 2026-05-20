-- =============================================================
-- Reports / mileage / event tagging
-- =============================================================

-- Tag expenses to an event (matches the existing event_name on takings)
alter table public.expenses
  add column if not exists event_name text;

-- Configurable rates on settings
alter table public.settings
  add column if not exists mileage_rate_per_mile numeric(5,3) not null default 0.45,
  add column if not exists corporation_tax_rate  numeric(5,2) not null default 19.00;

-- Mileage log (HMRC mileage allowance: 45p/mile first 10k, 25p after)
create table if not exists public.mileage_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  from_place   text not null,
  to_place     text not null,
  miles        numeric(8,2) not null check (miles >= 0),
  purpose      text,
  event_name   text,
  rate_used    numeric(5,3) not null default 0.45,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists mileage_logs_user_id_idx on public.mileage_logs(user_id);
create index if not exists mileage_logs_date_idx    on public.mileage_logs(date desc);

drop trigger if exists mileage_logs_touch on public.mileage_logs;
create trigger mileage_logs_touch before update on public.mileage_logs
  for each row execute function public.touch_updated_at();

alter table public.mileage_logs enable row level security;

drop policy if exists "mileage_logs_select_own" on public.mileage_logs;
drop policy if exists "mileage_logs_insert_own" on public.mileage_logs;
drop policy if exists "mileage_logs_update_own" on public.mileage_logs;
drop policy if exists "mileage_logs_delete_own" on public.mileage_logs;

create policy "mileage_logs_select_own" on public.mileage_logs for select using (auth.uid() = user_id);
create policy "mileage_logs_insert_own" on public.mileage_logs for insert with check (auth.uid() = user_id);
create policy "mileage_logs_update_own" on public.mileage_logs for update using (auth.uid() = user_id);
create policy "mileage_logs_delete_own" on public.mileage_logs for delete using (auth.uid() = user_id);
