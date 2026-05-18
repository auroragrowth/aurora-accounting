-- =============================================================
-- TAKINGS — ad-hoc income / takings not tied to an invoice
-- (SumUp, Square, cash at events, bank transfers, etc).
-- =============================================================

do $$ begin
  create type takings_source as enum (
    'cash', 'sumup', 'square', 'card', 'bank_transfer', 'other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.takings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  source       takings_source not null default 'cash',
  amount       numeric(12,2) not null check (amount >= 0),
  event_name   text,
  description  text,
  reference    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists takings_user_id_idx on public.takings(user_id);
create index if not exists takings_date_idx    on public.takings(date desc);
create index if not exists takings_source_idx  on public.takings(source);

drop trigger if exists takings_touch on public.takings;
create trigger takings_touch before update on public.takings
  for each row execute function public.touch_updated_at();

alter table public.takings enable row level security;

drop policy if exists "takings_select_own" on public.takings;
drop policy if exists "takings_insert_own" on public.takings;
drop policy if exists "takings_update_own" on public.takings;
drop policy if exists "takings_delete_own" on public.takings;

create policy "takings_select_own" on public.takings for select using (auth.uid() = user_id);
create policy "takings_insert_own" on public.takings for insert with check (auth.uid() = user_id);
create policy "takings_update_own" on public.takings for update using (auth.uid() = user_id);
create policy "takings_delete_own" on public.takings for delete using (auth.uid() = user_id);
