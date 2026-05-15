-- =============================================================
-- QUOTES — separate from invoices, convertible into them.
-- =============================================================

do $$ begin
  create type quote_status as enum ('draft', 'sent', 'accepted', 'declined', 'expired');
exception when duplicate_object then null; end $$;

create table if not exists public.quotes (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  quote_number          text not null,
  date                  date not null,
  valid_until           date not null,
  customer_id           uuid references public.customers(id) on delete set null,
  customer_snapshot     jsonb not null,
  items                 jsonb not null default '[]'::jsonb,
  notes                 text,
  terms                 text,
  vat_enabled           boolean not null default false,
  vat_rate              numeric(5,2) not null default 20,
  status                quote_status not null default 'draft',
  converted_invoice_id  uuid references public.invoices(id) on delete set null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (user_id, quote_number)
);

create index if not exists quotes_user_id_idx on public.quotes(user_id);
create index if not exists quotes_date_idx    on public.quotes(date desc);
create index if not exists quotes_status_idx  on public.quotes(status);

drop trigger if exists quotes_touch on public.quotes;
create trigger quotes_touch before update on public.quotes
  for each row execute function public.touch_updated_at();

alter table public.quotes enable row level security;

drop policy if exists "quotes_select_own" on public.quotes;
drop policy if exists "quotes_insert_own" on public.quotes;
drop policy if exists "quotes_update_own" on public.quotes;
drop policy if exists "quotes_delete_own" on public.quotes;

create policy "quotes_select_own" on public.quotes for select using (auth.uid() = user_id);
create policy "quotes_insert_own" on public.quotes for insert with check (auth.uid() = user_id);
create policy "quotes_update_own" on public.quotes for update using (auth.uid() = user_id);
create policy "quotes_delete_own" on public.quotes for delete using (auth.uid() = user_id);

alter table public.settings
  add column if not exists next_quote_number integer not null default 1,
  add column if not exists quote_prefix      text not null default 'QT-',
  add column if not exists quote_terms       text default 'This quote is valid for 30 days from the date of issue. Acceptance confirms your booking; payment terms as per the subsequent invoice.';

create or replace function public.next_quote_number()
returns text language plpgsql security definer set search_path = public as $$
declare v_prefix text; v_num integer; v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  update public.settings
     set next_quote_number = next_quote_number + 1
   where user_id = v_uid
   returning quote_prefix, next_quote_number - 1
        into v_prefix, v_num;
  return v_prefix || lpad(v_num::text, 4, '0');
end $$;

revoke execute on function public.next_quote_number() from anon, public;
grant   execute on function public.next_quote_number() to authenticated;
