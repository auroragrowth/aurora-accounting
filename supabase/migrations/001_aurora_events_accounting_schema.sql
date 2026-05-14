-- =============================================================
-- AURORA EVENTS HIRE LTD — Accounting & Invoicing schema
-- This migration has already been applied to your live Supabase
-- project. It's saved here so the codebase is self-contained
-- and you (or future developers) can recreate the DB if needed.
-- =============================================================

create extension if not exists pg_trgm;

-- ============ ENUMS ============
do $$ begin
  create type expense_category as enum (
    'staff', 'suppliers', 'purchases', 'equipment',
    'travel', 'marketing', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
exception when duplicate_object then null; end $$;

-- ============ CUSTOMERS ============
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  email       text,
  address     text,
  city        text,
  postcode    text,
  country     text default 'United Kingdom',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index customers_user_id_idx on public.customers(user_id);
create index customers_name_trgm_idx on public.customers using gin (name gin_trgm_ops);

-- ============ PAYEES ============
create table if not exists public.payees (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    expense_category default 'suppliers',
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index payees_user_id_idx on public.payees(user_id);
create index payees_name_trgm_idx on public.payees using gin (name gin_trgm_ops);

-- ============ EXPENSES ============
create table if not exists public.expenses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date            date not null,
  category        expense_category not null default 'other',
  vendor          text not null,
  description     text,
  amount          numeric(12,2) not null check (amount >= 0),
  payment_method  text,
  reference       text,
  receipt_path    text,
  receipt_type    text,
  receipt_name    text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index expenses_user_id_idx on public.expenses(user_id);
create index expenses_date_idx on public.expenses(date desc);
create index expenses_category_idx on public.expenses(category);

-- ============ INVOICES ============
create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  invoice_number  text not null,
  date            date not null,
  due_date        date not null,
  customer_id     uuid references public.customers(id) on delete set null,
  customer_snapshot jsonb not null,
  items           jsonb not null default '[]'::jsonb,
  notes           text,
  payment_terms   text,
  vat_enabled     boolean not null default false,
  vat_rate        numeric(5,2) not null default 20,
  status          invoice_status not null default 'draft',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, invoice_number)
);
create index invoices_user_id_idx on public.invoices(user_id);
create index invoices_date_idx on public.invoices(date desc);
create index invoices_status_idx on public.invoices(status);

-- ============ SETTINGS ============
create table if not exists public.settings (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  company_name         text default 'AURORA EVENTS HIRE LTD',
  company_number       text default '16712612',
  address              text default '30 St Marys Road',
  city                 text default 'Stowmarket',
  postcode             text default 'IP14 1LP',
  country              text default 'United Kingdom',
  email                text default 'info@auroraeventshire.uk',
  phone                text default '+44 7821 438685',
  website              text default 'auroraeventshire.uk',
  vat_number           text default '',
  bank_name            text default 'AURORA EVENTS HIRE LTD',
  bank_sort_code       text default '04-00-06',
  bank_account         text default '21612458',
  payment_terms        text default 'Payment due on the day of invoice (same day). Late payments may incur charges in accordance with the Late Payment of Commercial Debts (Interest) Act 1998.',
  next_invoice_number  integer not null default 1,
  invoice_prefix       text not null default 'INV-',
  vat_rate             numeric(5,2) not null default 20,
  vat_enabled          boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ============ updated_at TRIGGERS ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();
create trigger payees_touch    before update on public.payees    for each row execute function public.touch_updated_at();
create trigger expenses_touch  before update on public.expenses  for each row execute function public.touch_updated_at();
create trigger invoices_touch  before update on public.invoices  for each row execute function public.touch_updated_at();
create trigger settings_touch  before update on public.settings  for each row execute function public.touch_updated_at();

-- ============ AUTO-CREATE SETTINGS ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.settings (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ============ ATOMIC NEXT-INVOICE-NUMBER ============
create or replace function public.next_invoice_number()
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text; v_num integer; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  update public.settings
     set next_invoice_number = next_invoice_number + 1
   where user_id = v_uid
   returning invoice_prefix, next_invoice_number - 1
        into v_prefix, v_num;
  return v_prefix || lpad(v_num::text, 4, '0');
end $$;

revoke execute on function public.next_invoice_number() from anon, public;
grant   execute on function public.next_invoice_number() to authenticated;

-- ============ ROW LEVEL SECURITY ============
alter table public.customers enable row level security;
alter table public.payees    enable row level security;
alter table public.expenses  enable row level security;
alter table public.invoices  enable row level security;
alter table public.settings  enable row level security;

create policy "customers_select_own" on public.customers for select using (auth.uid() = user_id);
create policy "customers_insert_own" on public.customers for insert with check (auth.uid() = user_id);
create policy "customers_update_own" on public.customers for update using (auth.uid() = user_id);
create policy "customers_delete_own" on public.customers for delete using (auth.uid() = user_id);

create policy "payees_select_own" on public.payees for select using (auth.uid() = user_id);
create policy "payees_insert_own" on public.payees for insert with check (auth.uid() = user_id);
create policy "payees_update_own" on public.payees for update using (auth.uid() = user_id);
create policy "payees_delete_own" on public.payees for delete using (auth.uid() = user_id);

create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);

create policy "invoices_select_own" on public.invoices for select using (auth.uid() = user_id);
create policy "invoices_insert_own" on public.invoices for insert with check (auth.uid() = user_id);
create policy "invoices_update_own" on public.invoices for update using (auth.uid() = user_id);
create policy "invoices_delete_own" on public.invoices for delete using (auth.uid() = user_id);

create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id);
