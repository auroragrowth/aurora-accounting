# Aurora Events Hire — Bookkeeping & Invoicing System

A self-hosted bookkeeping app built for **Aurora Events Hire Ltd**, designed to be re-templated for other small businesses (e.g. a cafe). This document is both a snapshot of the current system and a starting point for adapting it.

---

## 1. Current feature set

| Area | What it does | Route(s) |
|---|---|---|
| **Dashboard** | Headline tiles for Main account / Mileage pot / Tax pot / Outstanding invoices, plus Income / Outgoings / Net profit. Spending-by-category chart, recent expenses, recent invoices, quick actions, "Export all" CSV button. | `/dashboard` |
| **Expenses** | Log money out: date, category, vendor, amount, payment method, reference, receipt upload (PDF or image), optional event tag. Auto-creates payees when a new vendor is entered. CSV export, search, category filter. | `/expenses` |
| **Income (Takings)** | Log money in by **source** (Cash / SumUp / Square / Card / Bank transfer / Other), with optional event tag and reference. Includes a **"Record SumUp payout"** workflow that creates N takings + 1 fee expense in one go. | `/takings` |
| **Mileage** | HMRC mileage allowance log (45p/mile for first 10k, 25p after). Per-trip date / from / to / miles / purpose / event. **Saved routes** dropdown for regular journeys. Live "claim" preview. | `/mileage` |
| **Quotes → Invoices** | Issue quotes that convert into invoices. Auto-numbered (`QT-####` / `INV-####`). VAT-aware. Customer dropdown + saved customers. Line items pull from the Catalogue. Email + Print/PDF actions. Statuses: draft / sent / accepted / declined / expired (quotes), draft / sent / paid / overdue (invoices). | `/quotes`, `/invoices` |
| **Contacts** | Customers + Payees & Suppliers, with categories on payees. Auto-populated when you log expenses / create invoices. | `/contacts` |
| **Catalogue** | Reusable line-item presets (description + default qty + default price + sort order). Appears as a dropdown on the invoice form. | `/catalogue` |
| **Director's loan** | Track money the director puts INTO the company and money the company pays back OUT. Headline tiles for paid-in / paid-out / outstanding balance. Direction-aware form. | `/directors-loan` |
| **Bank reconciliation** | Upload a Monzo CSV (statement export OR search export), the app matches each line against takings, paid invoices (±60 days), expenses, and director's-loan transfers (±3 days). Unmatched lines get one-click "Add to takings / expenses / director's loan" buttons with auto-detected category + source. Personal Paul Rudland transfers and ATM withdrawals are auto-skipped. | `/bank` |
| **Reports** | Hub linking to four sub-reports. | `/reports` |
| └ Profit & Loss | Revenue (takings + paid invoices) − expenses-by-category = net profit, with period picker (month / quarter / year / all). | `/reports/profit-loss` |
| └ Per-event profitability | Rolls up takings, expenses, and mileage by event_name. | `/reports/events` |
| └ Cash float | Cash takings (`source=cash`) vs cash-paid expenses (`payment_method=cash`) with a running till balance. | `/reports/cash-float` |
| └ Tax estimate | Corporation tax at configurable rate (default 19%) on net profit for the chosen period. | `/reports/tax` |
| **Pots** | Monzo-style summary of money to set aside (Mileage / VAT / Tax). Per-pot obligation, in-pot allocation, still-to-move + progress bar. **"Move to pot"** button records an allocation entry — resets the count for the next period. | `/pots` |
| **Settings** | Company details, bank details, VAT, payment terms, invoice/quote prefixes, mileage rate, corporation tax rate. | `/settings` |

---

## 2. Tech stack

- **Next.js 15** (App Router, server components, server actions)
- **TypeScript** throughout
- **Supabase** (Postgres + Auth + Storage + Row-Level Security)
- **Tailwind CSS 3**
- **Lucide React** icons
- **Vercel** hosting (auto-deploys from `main`)
- **GitHub**: `auroragrowth/aurora-accounting`

No client-state framework — server components handle data, sprinkle of `"use client"` for forms / modals / period picker.

---

## 3. Database schema

All tables use `auth.users(id)` as `user_id` FK and RLS policies `auth.uid() = user_id` for select/insert/update/delete.

### Core tables
| Table | Purpose | Key columns |
|---|---|---|
| `customers` | Invoice recipients | `name`, `email`, `address`, `city`, `postcode`, `notes` |
| `payees` | Expense recipients | `name`, `category` (`expense_category` enum), `notes` |
| `expenses` | Money out | `date`, `category`, `vendor`, `amount`, `payment_method`, `reference`, `event_name`, `receipt_path` |
| `takings` | Ad-hoc income | `date`, `source` (`takings_source` enum), `amount`, `event_name`, `description`, `reference` |
| `invoices` | Invoiced revenue | `invoice_number`, `date`, `due_date`, `customer_snapshot` (jsonb), `items` (jsonb), `vat_enabled`, `vat_rate`, `status` (`invoice_status` enum) |
| `quotes` | Pre-invoices | `quote_number`, `date`, `valid_until`, `items` (jsonb), `status` (`quote_status` enum), `converted_invoice_id` |
| `director_loans` | DL movements | `date`, `direction` (`loan_direction` enum: in/out), `amount`, `description`, `reference` |
| `mileage_logs` | HMRC mileage | `date`, `from_place`, `to_place`, `miles`, `rate_used`, `purpose`, `event_name` |
| `mileage_routes` | Saved journeys | `name`, `from_place`, `to_place`, `miles`, `sort_order` |
| `line_item_presets` | Invoice catalogue | `description`, `default_price`, `default_qty`, `sort_order` |
| `pot_allocations` | "I moved £X to a Monzo pot" | `pot` (`pot_kind` enum: mileage/vat/tax), `date`, `amount`, `note` |
| `settings` | Per-user config | Company / bank / VAT / rates / invoice & quote numbering |

### Enums
- `expense_category`: `staff` · `suppliers` · `purchases` · `equipment` · `travel` · `marketing` · `other`
- `takings_source`: `cash` · `sumup` · `square` · `card` · `bank_transfer` · `other`
- `invoice_status`: `draft` · `sent` · `paid` · `overdue`
- `quote_status`: `draft` · `sent` · `accepted` · `declined` · `expired`
- `loan_direction`: `in` · `out`
- `pot_kind`: `mileage` · `vat` · `tax`

### Storage
- Bucket `receipts` (private) for expense receipt uploads, accessed via signed URLs.

### Migrations
All migrations in `supabase/migrations/`:
- `001` — initial schema
- `002` — receipts bucket
- `003` — line-item presets
- `004` — seed historical customers + presets
- `005` — seed payees
- `006` — quotes
- `007` — takings
- `008` — director's loans
- `009` — mileage + events on expenses + settings rate columns
- `010` — mileage routes
- `011` — pot allocations

---

## 4. File structure

```
app/
  (app)/                      # authenticated app routes (layout.tsx wraps with Header + Nav)
    dashboard/, expenses/, takings/, mileage/, quotes/, invoices/,
    contacts/, catalogue/, directors-loan/, bank/, reports/, pots/, settings/
    each route has page.tsx (server component) and actions.ts (server actions)
  auth/                       # callback + signout
  login/                      # login page
components/
  ui.tsx                      # Field, Modal, Card, PageHeader, EmptyState, StatusPill, Th, Td
  nav.tsx                     # sidebar (with mobile hamburger)
  header.tsx                  # top bar
  *-view.tsx, *-form.tsx      # per-area views and modal forms
  period-picker.tsx, export-all-button.tsx, etc.
lib/
  supabase/                   # client & server Supabase factories
  types.ts                    # TypeScript interfaces + enums + label maps
  utils.ts                    # fmtGBP, fmtDate, todayISO, invoiceTotal helpers
  reports.ts                  # computeTotals, rollupByEvent, estimateCorporationTax, etc.
  period.ts                   # PERIOD_PRESETS, periodRange, periodLabel
  monzo-csv.ts                # CSV parser + Monzo row classifier
  bank-types.ts               # shared ReconcileResult / ReconcileLine types
  image.ts                    # receipt processing
supabase/
  migrations/                 # numbered SQL files
```

---

## 5. Auth model (current — single user)

- Single-user assumption: each row carries `user_id = auth.uid()`. RLS policies ensure users only see their own rows.
- Two real users exist in the Supabase auth table (`paul@auroraeventshire.uk`, `info@auroraeventshire.uk`) but the seeded data is all under Paul's `user_id`.
- No roles, no team accounts, no admin/staff split.

This is fine for a one-person limited company, **but not for a cafe** where you'd want staff to be able to log time / temps / sales without seeing the financials.

---

## 6. Adapting for the cafe

You'll keep most of the accounting core (expenses, invoicing, takings, reports, pots, bank reconciliation, mileage, director's loan). The big additions and changes:

### 6.1 Auth & roles (BIGGEST CHANGE)

Add a `profiles` table that links to `auth.users` and carries a `role` column:

```sql
create type user_role as enum ('owner', 'manager', 'staff');

create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  role       user_role not null default 'staff',
  hourly_rate numeric(8,2),
  active     boolean not null default true,
  created_at timestamptz default now()
);
```

Then rewrite RLS to be **role-aware**, e.g.:
- Financial tables (expenses, invoices, takings, etc.): owner + manager only
- Operational tables (time logs, fridge temps, wastage, stock counts): all staff can insert, only managers can read across users
- Profiles: each user sees their own row; managers see all

Pattern in policies:

```sql
create policy "owners_and_managers_can_select" on public.expenses
  for select using (
    exists (select 1 from public.profiles p
            where p.user_id = auth.uid()
              and p.role in ('owner','manager'))
  );
```

UI: hide nav entries that the user's role can't access (check the role on layout load, gate the `TABS` array).

### 6.2 Staff time logs

```sql
create table public.time_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id),   -- the staff member
  clock_in     timestamptz not null,
  clock_out    timestamptz,
  hourly_rate  numeric(8,2),   -- snapshot at clock-in (for historical accuracy)
  notes        text,
  created_at   timestamptz default now()
);
```

- Staff have a "Clock in / Clock out" button on a simplified mobile-first screen.
- Manager view: weekly timesheet, hours per staff member, calculated wages.
- Should auto-create an expense (`category='staff'`, vendor = staff name) when a shift is closed and the rate × hours wage is calculated — or run on a weekly batch.

### 6.3 Staff wages (payroll-lite)

```sql
create table public.wage_payments (
  id            uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null references auth.users(id),
  period_start  date not null,
  period_end    date not null,
  hours         numeric(6,2) not null,
  gross         numeric(10,2) not null,
  paid_at       date,
  paid_via      text,  -- bank / cash / etc
  reference     text
);
```

- Generates from time logs at week's end.
- When paid, creates an expense row automatically.
- This is **not** proper PAYE — for HMRC compliance the cafe will still need a payroll provider (e.g. BrightPay, Xero Payroll) but this tracks the gross-pay liability internally.

### 6.4 Cash in / cash out (extends current Cash Float)

Already partially in place via `takings.source='cash'` + `expenses.payment_method='cash'`. For a cafe:

- Add **end-of-day cash up**: a `cash_counts` table where each closing shift records counted notes/coins, expected total (from till sales), and the difference.
- Add **petty cash withdrawals**: `cash_movements` table with `direction` (in/out) and `reason` (float top-up / bank deposit / cash purchase).

```sql
create table public.cash_counts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null,  -- who closed up
  date          date not null,
  counted       numeric(10,2) not null,
  expected      numeric(10,2) not null,  -- from till z-read / sales
  difference    numeric(10,2) generated always as (counted - expected) stored,
  notes         text
);
```

### 6.5 Stock with role-based access

```sql
create table public.stock_items (
  id           uuid primary key default gen_random_uuid(),
  sku          text unique,
  name         text not null,
  category     text,
  unit         text,             -- kg, each, litre
  par_level    numeric(10,2),    -- target on-hand
  reorder_at   numeric(10,2),    -- threshold to trigger an order
  cost_price   numeric(10,2),    -- for COGS — managers only
  sell_price   numeric(10,2),
  allergens    text[],           -- gluten, dairy, nuts, etc.
  active       boolean default true
);

create table public.stock_counts (
  id           uuid primary key default gen_random_uuid(),
  stock_item_id uuid references public.stock_items(id),
  user_id      uuid not null,    -- who counted
  date         date not null,
  on_hand      numeric(10,2) not null,
  notes        text
);

create table public.stock_movements (
  id           uuid primary key default gen_random_uuid(),
  stock_item_id uuid references public.stock_items(id),
  user_id      uuid not null,
  date         date not null,
  direction    text not null,    -- in / out / waste
  quantity     numeric(10,2) not null,
  unit_cost    numeric(10,2),
  reason       text,             -- delivery / sale / wastage / theft
  reference    text              -- supplier invoice / order id
);
```

**Role-based access**:
- Owner / manager: full CRUD on stock_items (set prices, allergens, par levels). See cost prices.
- Staff: can read item names + on-hand, **cannot** see cost prices. Can insert stock_counts (during a count) and stock_movements (delivery in, wastage out).

Use Postgres column-level grants OR omit `cost_price` from staff-visible views.

### 6.6 Fridge temperature log (EHO compliance)

Critical for Environmental Health — fridges/freezers must be checked at least daily, often twice.

```sql
create table public.appliances (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,        -- "Walk-in fridge", "Display chiller", "Freezer 1"
  kind        text not null,        -- fridge / freezer / hot-hold
  target_min  numeric(4,1),         -- ideal range
  target_max  numeric(4,1),
  location    text,
  active      boolean default true
);

create table public.temperature_logs (
  id            uuid primary key default gen_random_uuid(),
  appliance_id  uuid references public.appliances(id),
  user_id       uuid not null,
  recorded_at   timestamptz not null default now(),
  temperature   numeric(4,1) not null,
  in_range      boolean generated always as (true) stored,  -- computed via trigger against appliance range
  notes         text,
  photo_path    text                                         -- optional: photo of probe display
);
```

UI: a mobile-first screen with **big buttons** ("Tap to log fridge temp"), pre-set appliances, enter temp, save. Out-of-range entries flash red and require a note. Manager dashboard shows compliance % per week + missed checks.

**EHO inspector view**: a printable monthly report showing all temperature checks per appliance, who logged them, any out-of-range entries with the corrective action notes.

### 6.7 Other cafe-specific bits worth adding

| Feature | Why | Sketch |
|---|---|---|
| **Delivery / GRN log** | Track supplier deliveries — what arrived vs what was ordered | Table linked to supplier + stock_items |
| **Wastage log** | EHO + cost control | A `direction='waste'` entry on stock_movements with reason |
| **Daily checklist** | Cleaning, prep, close-down checks | A `checklists` table with items + `checklist_runs` per shift |
| **Allergen matrix** | Legal requirement | `allergens text[]` on stock_items + a printable allergen sheet generated from menu items |
| **Tips management** | Distribute tronc fairly | Pool tips per shift, allocate to staff by hours worked, output as adjustment on wages |
| **Till integration** | Bring in Square / SumUp till sales automatically | Use their API or daily CSV import (we already have CSV parser pattern from Monzo) |

### 6.8 What to drop or rename

| In Aurora | In Cafe |
|---|---|
| Quotes | Probably drop (cafes don't quote) |
| Mileage | Drop (or keep for owner deliveries) |
| Director's loan | Keep (most small cafes are Ltd with director funding) |
| Catalogue (line item presets) | Pivot to **menu items** (food/drink with prices + cost + allergens) |
| `expense_category.travel` | Add `food_purchases`, `drink_purchases`, `cleaning`, `rent_utilities` |
| Events (`event_name` tagging) | Drop, or repurpose as "service" / "day part" (breakfast / lunch / dinner) |

---

## 7. Deployment

- `git push origin main` → Vercel auto-deploys production.
- Vercel project URL: `aurora-accounting-git-main-aurora-growths-projects.vercel.app`.
- Supabase project: `uqhxfhmpgdicnexthwew` (live data).
- Migrations are applied via `mcp__claude_ai_Supabase__apply_migration` during development; in prod you can use the Supabase CLI or dashboard to apply the SQL files.

### Local dev
```bash
npm install
cp .env.example .env.local  # add Supabase URL + anon key
npm run dev
```

---

## 8. Known open work (Aurora)

- VAT tracking on expenses (input VAT) — needed when VAT-registered. Pot already exists for output VAT.
- Auto-prompt to delete duplicate takings when an invoice is marked paid (to avoid the FLINT HALL double-count we hit).
- Detailed SumUp transactions report import (CSV → automatic event split).
- Receipt OCR (auto-extract vendor / amount / VAT from photos).
- Open Banking sync (replace Monzo CSV uploads).

---

## 9. Adaptation checklist for the cafe

In rough order:

1. Fork this repo, rename, point at a new Supabase project.
2. Apply migrations 001-011, then:
3. Add `user_role` enum + `profiles` table (migration 012).
4. Rewrite RLS policies to be role-aware on all financial tables.
5. Build a Staff layout — mobile-first, restricted nav (only Time logs / Fridge temps / Stock count / Wastage).
6. Build a Manager layout — everything except company-level settings.
7. Build an Owner layout — everything.
8. Add `time_logs`, `wage_payments`, `cash_counts`, `appliances`, `temperature_logs`, `stock_items`, `stock_movements`, `stock_counts` tables + their UI.
9. Add cafe-specific expense categories.
10. Drop/rename Quotes / Mileage / Catalogue → Menu as appropriate.
11. Add the EHO compliance report (printable temperature log).
12. Wire SumUp / Square till sales import for daily takings (extends bank-reconcile CSV parser pattern).

---

_Last updated: 2026-05-20 — Aurora Events Hire Ltd's bookkeeping system at commit `acfb832`._
