-- =============================================================
-- POT ALLOCATIONS — record when money is physically moved to a
-- Monzo pot (mileage / VAT / tax). Lets the system show "still to
-- move" vs "already in pot" separately from the calculated
-- obligation.
-- =============================================================

do $$ begin
  create type pot_kind as enum ('mileage', 'vat', 'tax');
exception when duplicate_object then null; end $$;

create table if not exists public.pot_allocations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  pot          pot_kind not null,
  date         date not null,
  amount       numeric(12,2) not null check (amount >= 0),
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists pot_allocations_user_idx on public.pot_allocations(user_id, pot, date desc);

drop trigger if exists pot_allocations_touch on public.pot_allocations;
create trigger pot_allocations_touch before update on public.pot_allocations
  for each row execute function public.touch_updated_at();

alter table public.pot_allocations enable row level security;

drop policy if exists "pot_allocations_select_own" on public.pot_allocations;
drop policy if exists "pot_allocations_insert_own" on public.pot_allocations;
drop policy if exists "pot_allocations_update_own" on public.pot_allocations;
drop policy if exists "pot_allocations_delete_own" on public.pot_allocations;

create policy "pot_allocations_select_own" on public.pot_allocations for select using (auth.uid() = user_id);
create policy "pot_allocations_insert_own" on public.pot_allocations for insert with check (auth.uid() = user_id);
create policy "pot_allocations_update_own" on public.pot_allocations for update using (auth.uid() = user_id);
create policy "pot_allocations_delete_own" on public.pot_allocations for delete using (auth.uid() = user_id);
