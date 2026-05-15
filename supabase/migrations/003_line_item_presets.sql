-- =============================================================
-- LINE ITEM PRESETS — reusable catalogue of services/products
-- that can be picked from a dropdown when building an invoice.
-- =============================================================

create table if not exists public.line_item_presets (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  description     text not null,
  default_price   numeric(12,2) not null default 0 check (default_price >= 0),
  default_qty     numeric(12,2) not null default 1 check (default_qty >= 0),
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index line_item_presets_user_id_idx on public.line_item_presets(user_id);
create index line_item_presets_sort_idx    on public.line_item_presets(user_id, sort_order, description);

create trigger line_item_presets_touch
  before update on public.line_item_presets
  for each row execute function public.touch_updated_at();

alter table public.line_item_presets enable row level security;

create policy "line_item_presets_select_own" on public.line_item_presets for select using (auth.uid() = user_id);
create policy "line_item_presets_insert_own" on public.line_item_presets for insert with check (auth.uid() = user_id);
create policy "line_item_presets_update_own" on public.line_item_presets for update using (auth.uid() = user_id);
create policy "line_item_presets_delete_own" on public.line_item_presets for delete using (auth.uid() = user_id);
