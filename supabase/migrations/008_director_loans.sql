-- =============================================================
-- DIRECTOR'S LOAN ACCOUNT — track money the director puts in
-- (direction='in') and money the company pays back to the
-- director (direction='out').
-- =============================================================

do $$ begin
  create type loan_direction as enum ('in', 'out');
exception when duplicate_object then null; end $$;

create table if not exists public.director_loans (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  date         date not null,
  direction    loan_direction not null,
  amount       numeric(12,2) not null check (amount >= 0),
  description  text,
  reference    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists director_loans_user_id_idx on public.director_loans(user_id);
create index if not exists director_loans_date_idx    on public.director_loans(date desc);

drop trigger if exists director_loans_touch on public.director_loans;
create trigger director_loans_touch before update on public.director_loans
  for each row execute function public.touch_updated_at();

alter table public.director_loans enable row level security;

drop policy if exists "director_loans_select_own" on public.director_loans;
drop policy if exists "director_loans_insert_own" on public.director_loans;
drop policy if exists "director_loans_update_own" on public.director_loans;
drop policy if exists "director_loans_delete_own" on public.director_loans;

create policy "director_loans_select_own" on public.director_loans for select using (auth.uid() = user_id);
create policy "director_loans_insert_own" on public.director_loans for insert with check (auth.uid() = user_id);
create policy "director_loans_update_own" on public.director_loans for update using (auth.uid() = user_id);
create policy "director_loans_delete_own" on public.director_loans for delete using (auth.uid() = user_id);
