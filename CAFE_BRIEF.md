# Cafe Management System — Project Brief

A comprehensive brief for adapting the Aurora Events Hire bookkeeping system into a full cafe operations platform. Covers users, features, compliance, tech, data model, integrations, and a realistic phased build plan.

> **Reference:** see [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) for the Aurora system being forked.

---

## 1. Vision

A single platform that runs the cafe end-to-end:

- **Owner / accountant** sees the financial picture in real time — P&L, cash flow, VAT, tax, GP margins.
- **Manager** runs daily operations — rotas, ordering, stock, staff hours, compliance.
- **Staff** clock in/out, log temps, count stock, record wastage, take orders — on phones, with minimal friction.
- **EHO inspector** (occasional) can be shown a printable compliance pack at a moment's notice.

The system replaces or reduces the need for: a separate till-only bookkeeper, paper temperature charts, spreadsheet rotas, paper allergen sheets, paper stock counts, separate payroll software (gross-pay tracking only — PAYE still needs a proper provider).

---

## 2. User personas & access levels

### 2.1 Owner (1–2 users)
- Sees everything: financials, payroll, P&L, GP, stock costs, VAT.
- Sets prices, hourly rates, supplier accounts.
- Pays staff, files VAT, sees corporation tax position.

### 2.2 Manager (1–3 users)
- Sees operational view: today's sales, labour cost, stock alerts, compliance gaps.
- Can edit menu items, place orders, approve timesheets, manage rota.
- **Cannot** see corporation tax / VAT pots / director's loan / company-level settings.

### 2.3 Staff (up to ~20 users)
- Mobile-first restricted layout.
- Sees: clock in/out screen, fridge temp log, stock count screen, wastage log, daily checklist.
- **Cannot** see: cost prices, P&L, anyone else's hours, customer data beyond what's needed to serve them.

### 2.4 Customer (public, no login)
- (Optional v2) Online ordering, table booking, loyalty card.

### 2.5 EHO inspector (no login — printable view)
- Generated PDF pack: temperature logs, cleaning schedule, allergen matrix, staff training certs, pest control log, traceability of recent deliveries.

---

## 3. Feature inventory

Grouped by area. **Bold** = critical for opening day. *Italic* = nice-to-have v2+.

### 3.1 Front of house (FOH)

- **Point of Sale (POS)** — either embed an existing POS (Square Reader, SumUp Solo, Zettle) and ingest sales by API/CSV, OR build a lightweight in-app till. Recommended: **integrate Square/SumUp** for v1 because building a compliant till is a project on its own.
- **Cash drawer / receipt printer integration** (optional, via Square/SumUp)
- *Table ordering via QR code* (v2)
- *Pay-at-table* (v2)

### 3.2 Kitchen / production

- **Recipe management** — each menu item linked to ingredients with quantities, so a sold latte automatically depletes milk, beans, cup, sugar from stock.
- **Allergen matrix** — every menu item tagged with allergens (gluten, dairy, eggs, nuts, etc.). Printable allergen sheet per item / per menu. **Legal requirement under Natasha's Law for PPDS items.**
- *Kitchen display system (KDS)* — orders appearing on a screen in the kitchen (v2)
- *Recipe portion-control checklists*

### 3.3 Menu management

- **Menu items** — name, category (food/drink/etc.), sell price, cost price, GP%, allergens, photo, description, active flag.
- **Modifiers** — extra shot, oat milk, takeaway, etc., each potentially with a price + cost.
- **Specials / time-based menus** — breakfast menu, lunch menu, evening menu.
- *Menu engineering report* — popularity vs GP% (the "stars / dogs / puzzles / plough-horses" matrix)

### 3.4 Stock & ordering

- **Stock items** — name, SKU, supplier, unit (kg / each / litre), cost price, par level, reorder threshold, current on-hand, allergens.
- **Stock counts** — staff-facing screen, items pre-filled by category. Save count per item, system records variance to expected.
- **Stock movements** — deliveries in, sales out (auto from POS via recipes), wastage out, transfers out.
- **Suppliers** — name, contact, delivery days, account number, minimum order, payment terms.
- **Order pads** — auto-generated from below-par-level items, send to supplier as PDF/email.
- **Delivery / GRN (Goods Received Note)** — when stock arrives, confirm what came vs what was ordered, attach invoice PDF, system creates expense + payee.
- **Wastage log** — staff record waste with reason: out of date / damaged / dropped / customer return / spillage / mistake. Cost reported to manager.
- *Theoretical vs actual stock variance* — flag items where actual is consistently below theoretical (potential theft / over-portioning).

### 3.5 Staff management

- **Staff profiles** — name, role, hourly rate, contact details, emergency contact, right-to-work doc reference, start date, active flag.
- **Time logs (clock in/out)** — mobile-first big-button screen. Optional photo at clock-in for verification.
- **Rota / scheduling** — manager assigns shifts in advance; staff see their schedule; conflicts flagged.
- **Holiday tracking** — entitlement, requests, remaining balance.
- **Sick leave** log.
- **Training records** — Level 2 Food Hygiene, allergen awareness, first aid, fire safety. Expiry dates with renewal alerts.
- **Wages / gross pay** — generated from time logs at end of week. Becomes an expense. *Does not replace HMRC payroll software* — pair with BrightPay or Xero Payroll for PAYE/NI.
- **Tips / tronc management** — pool tips per shift, distribute by hours worked, surface as wage top-up.

### 3.6 Compliance / EHO

- **Fridge / freezer / hot-hold temperature logs** — appliances list with target ranges, mobile-first quick log, out-of-range entries require a corrective-action note.
- **Cleaning schedule / daily checklist** — pre-defined tasks per shift (open / mid / close), staff tick off, manager sees completion %.
- **HACCP plan documents** — store HACCP doc + critical control points; link to temperature logs as evidence.
- **Pest control log** — visit dates, inspector, findings, actions.
- **Food hygiene rating** — record and display current rating, inspection date, last report.
- **Allergen sheets** — generated from menu items; printable PDF per shift.
- **Supplier traceability** — for any food item, trace back to which delivery / supplier / batch (required for product recalls).
- **Risk assessments** — fire, slips/trips, manual handling, etc. — stored docs with review dates.
- **Accident book** — digital log of any incidents.

### 3.7 Financial / bookkeeping (inherit from Aurora, adapt)

- **Expenses** — with cafe-specific categories: food / drink / cleaning / utilities / rent / repairs / insurance / staff / marketing / other.
- **Income / Takings** — by source (cash, card, online).
- **End-of-day cash up** — counted notes & coins vs expected from till; difference flagged.
- **Petty cash management** — float, top-ups, withdrawals.
- **Bank reconciliation** — Monzo/business bank CSV upload, match against till takings + expenses + DL.
- **Invoices** (for B2B catering / functions) — keep from Aurora.
- **Director's loan** — keep.
- **VAT tracking** — output VAT on sales, input VAT on receipts. Quarterly return summary. **MTD-compliant submission via Xero / FreeAgent / standalone MTD bridge.**
- **Corporation tax estimate** — keep from Aurora.
- **Pots** (mileage / tax / VAT) — keep.

### 3.8 Reporting

- **Daily sales report** — total sales, by category, by hour, payment mix.
- **Labour cost report** — wages as % of sales (target ~25-35% in cafes).
- **Food cost report** — COGS as % of sales (target ~25-35%).
- **GP report** — gross profit by category and by item.
- **Wastage report** — value of waste this period, by reason.
- **Compliance report** — temperature compliance %, missed checks, training expiry.
- **P&L** — by month / quarter / year.
- **Cash flow** — main account + each pot balance.
- *Hour-by-hour heatmap* — when are we busiest?
- *Forecast vs actual* (v2+)

### 3.9 Customer / loyalty (v2+)

- *Customer database* — opt-in only (GDPR).
- *Loyalty cards / stamps* — buy 9 coffees, 10th free.
- *Email signup* — newsletter list.
- *Online ordering / click & collect.*
- *Gift cards.*
- *Reservations / bookings.*

### 3.10 Marketing (v2+)

- *Promo codes / discounts.*
- *Email campaigns* (or integrate Mailchimp).
- *Social media scheduling* (or integrate Buffer).
- *Customer reviews collection* (Google review prompts on receipts).

---

## 4. Compliance & legal requirements

A non-exhaustive list — the cafe owner / accountant should validate with local authorities and a solicitor.

### 4.1 Food safety
- **Food Hygiene Rating Scheme (FHRS)** — score 0–5 displayed publicly.
- **HACCP plan** — documented system covering Hazard Analysis and Critical Control Points.
- **Temperature monitoring** — fridges ≤ 5°C, freezers ≤ -18°C, hot holding ≥ 63°C. Records for at least the previous month, ideally longer.
- **Allergen labelling — Natasha's Law (PPDS)** — pre-packed for direct sale food must show full ingredient list with allergens emphasised. Penalties for non-compliance.
- **Food traceability** — one step forward, one step back (who supplied it, who you sold it to if B2B).
- **Staff food hygiene training** — Level 2 minimum, every 3 years recommended.

### 4.2 Employment
- **Right-to-work checks** — for every employee. Records kept for 2 years after employment ends.
- **Working Time Regulations** — 48 hours/week max (with opt-out), breaks, holiday entitlement.
- **National Minimum / Living Wage** — check current rates by age bracket.
- **PAYE / NI** — register with HMRC, run RTI submissions every pay run.
- **Pensions auto-enrolment** — staff over 22 earning > £10k/year must be auto-enrolled.

### 4.3 Health & safety
- **Risk assessments** — fire, manual handling, slips/trips, COSHH (cleaning chemicals).
- **Accident book** — RIDDOR-reportable accidents must be notified to HSE.
- **Fire safety** — Regulatory Reform (Fire Safety) Order 2005 — written assessment, evacuation plan, equipment maintained.
- **First aid** — at least one trained first aider, kit, accident book.

### 4.4 Financial
- **Companies House** — annual confirmation statement + accounts.
- **HMRC** — corporation tax (CT600), VAT returns (if registered), PAYE.
- **MTD for VAT** — mandatory if VAT-registered; the cafe app must either be MTD-bridge-compliant OR integrate with one (Xero, FreeAgent, QuickBooks).
- **GDPR / data protection** — if storing customer data, register with ICO and comply with the Data Protection Act 2018.

### 4.5 Premises
- **Licensing** — alcohol (if served), late-night refreshment (after 23:00), music.
- **Trade waste contract** — domestic bins are not allowed for commercial waste.
- **Public liability insurance** — typically £5m+.
- **Employer's liability insurance** — mandatory £5m minimum.

---

## 5. Tech stack (recommended, inherit from Aurora)

Same as Aurora unless noted:

- **Next.js 15** App Router (server components + server actions)
- **TypeScript**
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Tailwind CSS**
- **Lucide React** icons
- **Vercel** hosting

### Cafe-specific additions
- **Square API** or **SumUp API** — pull till sales nightly. Webhook for live mode.
- **Stripe** — for online ordering payments (v2).
- **Resend** / **Postmark** — transactional email (order confirmations, supplier orders).
- **Twilio** / **Vonage** — SMS for booking confirmations (v2).
- **PDFKit** / **React-PDF** — for printable EHO compliance packs, supplier order pads.
- **react-chartjs-2** or **recharts** — sales / GP / labour charts.

---

## 6. Data model — additions to the Aurora schema

(Aurora's existing tables stay; many get renamed or repurposed. New tables below.)

```sql
-- Roles
create type user_role as enum ('owner', 'manager', 'staff');

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role user_role not null default 'staff',
  hourly_rate numeric(8,2),
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  right_to_work_ref text,
  start_date date,
  active boolean default true
);

-- Time & wages
create table time_logs ( id uuid pk, user_id uuid, clock_in tstz, clock_out tstz, hourly_rate numeric, notes text );
create table wage_payments ( id uuid pk, staff_user_id uuid, period_start date, period_end date, hours numeric, gross numeric, paid_at date, paid_via text, reference text );
create table tip_pools ( id uuid pk, date date, total_collected numeric, distribution jsonb );

-- Cash management
create table cash_counts ( id uuid pk, user_id uuid, date date, counted numeric, expected numeric, difference numeric, notes text );
create table cash_movements ( id uuid pk, user_id uuid, date date, direction text, amount numeric, reason text, reference text );

-- Stock
create table stock_items ( id uuid pk, sku text, name text, category text, unit text, par_level numeric, reorder_at numeric, cost_price numeric, sell_price numeric, supplier_id uuid, allergens text[], active boolean );
create table stock_counts ( id uuid pk, stock_item_id uuid, user_id uuid, date date, on_hand numeric, notes text );
create table stock_movements ( id uuid pk, stock_item_id uuid, user_id uuid, date date, direction text, quantity numeric, unit_cost numeric, reason text, reference text );
create table suppliers ( id uuid pk, name text, contact_name text, email text, phone text, delivery_days text[], account_number text, payment_terms text );
create table purchase_orders ( id uuid pk, supplier_id uuid, date date, status text, items jsonb, total numeric, notes text );

-- Menu
create table menu_items ( id uuid pk, name text, category text, sell_price numeric, recipe jsonb, allergens text[], photo_path text, description text, active boolean );
create table modifiers ( id uuid pk, name text, price numeric, applies_to text[] );

-- Compliance
create table appliances ( id uuid pk, name text, kind text, target_min numeric, target_max numeric, location text, active boolean );
create table temperature_logs ( id uuid pk, appliance_id uuid, user_id uuid, recorded_at tstz, temperature numeric, in_range boolean, notes text, photo_path text );
create table cleaning_tasks ( id uuid pk, name text, frequency text, area text );
create table cleaning_log ( id uuid pk, task_id uuid, user_id uuid, completed_at tstz, notes text );
create table training_records ( id uuid pk, user_id uuid, type text, certificate_ref text, issued_at date, expires_at date, document_path text );
create table risk_assessments ( id uuid pk, title text, document_path text, reviewed_at date, next_review_at date );
create table accident_log ( id uuid pk, occurred_at tstz, person text, description text, action_taken text, riddor_reportable boolean, reported_at tstz );
create table pest_control_visits ( id uuid pk, date date, company text, inspector text, findings text, actions text, document_path text );

-- Customer (v2)
create table customers_loyalty ( id uuid pk, email text, name text, phone text, marketing_consent boolean, stamps_count int, lifetime_value numeric, created_at tstz );
create table reservations ( id uuid pk, customer_id uuid, date date, time time, party_size int, status text, notes text );

-- Till integration
create table till_imports ( id uuid pk, source text, date date, gross numeric, fees numeric, net numeric, payment_mix jsonb, raw_payload jsonb, imported_at tstz );
```

### RLS overview

| Table | Owner | Manager | Staff |
|---|---|---|---|
| profiles | RW all | R all, U own | R own, U own |
| time_logs | RW all | R all, U all | RW own |
| wage_payments | RW all | R all | R own |
| cash_counts | RW all | RW all | I + R own |
| stock_items | RW all (incl. cost) | RW all (incl. cost) | R (no cost) |
| stock_counts | R all | R all | I + R own |
| stock_movements | RW all | RW all | I waste/delivery only |
| menu_items | RW all | RW all | R (no cost) |
| appliances | RW all | RW all | R |
| temperature_logs | R all | R all | I + R own |
| expenses / invoices / takings / dl / pots | RW all | RW (some restrictions) | None |

---

## 7. UX considerations

### 7.1 Staff layout (mobile-first)
- Massive tap targets, minimal text input, almost everything is a button press.
- 6 main screens: **Clock in/out · Temperature log · Stock count · Wastage · Checklist · Help**.
- Auto-locks after 30 min idle; manager PIN to unlock for management actions.
- Works on a wall-mounted iPad / Android tablet at the kitchen pass.

### 7.2 Manager layout
- Dashboard widgets: today's sales, labour cost %, food cost %, compliance %, stock alerts.
- Standard left nav with: Sales / Stock / Staff / Menu / Compliance / Reports / Settings.

### 7.3 Owner layout
- Manager layout + Financial section (P&L, VAT, Tax pot, Director's loan, Bank).
- "View as manager" / "View as staff" toggle for testing.

### 7.4 EHO printout
- Single-click "Generate compliance pack" button.
- Outputs PDF: temperature log table for date range, cleaning completion, training certs not expired, pest control visits, allergen sheet, latest food hygiene rating.

---

## 8. Integrations

| Integration | When | Reason |
|---|---|---|
| **Square API** | v1 (if using Square) | Pull till sales, ingest payouts |
| **SumUp API** | v1 (if using SumUp) | Same as above |
| **Open Banking** (e.g. Plaid / TrueLayer / GoCardless) | v1 | Live bank feed instead of CSV upload |
| **Companies House API** | v1 | Auto-populate company details |
| **Resend / Postmark** | v1 | Order confirmations, supplier order emails, invoices |
| **HMRC MTD** | v1 if VAT-registered | File quarterly VAT returns |
| **Xero / FreeAgent / QuickBooks** | optional | Some owners prefer to export to a familiar package |
| **Stripe** | v2 | Online ordering |
| **Twilio / Vonage** | v2 | SMS reservation confirms |
| **Mailchimp / Brevo** | v2 | Marketing emails |

---

## 9. Phased build plan

### Phase 0 — Foundation (1–2 weeks)
- Fork Aurora repo, point at new Supabase.
- Add `profiles` + roles + RLS rewrite.
- Three layouts (owner / manager / staff) + nav gating.
- Login + profile setup flow.

### Phase 1 — Operations MVP (4–6 weeks)
- Time logs (clock in/out screen + manager timesheet view).
- Temperature logs (appliances + log screen + manager dashboard).
- Stock items + stock counts + wastage log.
- Cash counts (end-of-day cash up).
- Daily checklist.
- EHO compliance pack PDF.

### Phase 2 — Sales & Stock (4–6 weeks)
- POS integration (Square OR SumUp): daily payout import.
- Menu items + recipes.
- Recipe-driven stock depletion.
- Supplier + delivery / GRN flow.
- Order pad generation.
- Allergen matrix + printable allergen sheet.

### Phase 3 — Financial (3–4 weeks)
- Adapt Aurora's accounting: cafe expense categories, invoicing for B2B (events / functions).
- VAT tracking with input VAT on expenses.
- MTD VAT return integration.
- Wage payments from time logs.
- Tips pool distribution.

### Phase 4 — Staff & Compliance (3–4 weeks)
- Rota / scheduling.
- Holiday + sick leave.
- Training records with expiry alerts.
- Risk assessments + accident log + pest control.

### Phase 5 — Reporting (2–3 weeks)
- Daily / weekly / monthly sales reports.
- Labour & food cost % dashboards.
- Wastage cost analysis.
- Menu engineering report.

### Phase 6 — Customer-facing (4–6 weeks, optional)
- Customer database + loyalty stamps.
- Online ordering / click & collect.
- Reservations.
- Email signup.

**Realistic total: 5–7 months for a single competent dev, less with multiple.**

---

## 10. Open questions to answer before kick-off

- Which **till provider**? Square / SumUp / Zettle / other / build in-house?
- Which **bank**? Determines Open Banking provider choice (or stick with CSV).
- **VAT-registered** from day 1 or below threshold?
- **Limited company or sole trader**? Affects financial features (director's loan, CT estimate).
- **Multi-site ambitions**? If yes, design data model with `site_id` from the start.
- **POS hardware**: existing till on the way out, or building from scratch?
- **Existing software** any of it should be replaced (not just supplemented)?
- **Number of staff at peak** — affects rota complexity.
- **Cuisine / menu complexity** — fast-casual coffee vs full restaurant menu changes the recipe + stock complexity significantly.
- **Customer-facing online** in scope, or focus on operations + back office only?
- **Wifi reliability** — if patchy, need offline-first for staff screens.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Scope creep** — every cafe owner wants "just one more thing" | Lock the v1 feature list. Anything else goes to a parking-lot doc. |
| **POS integration breaks** mid-service | Cache last-known good data; design for offline read; have a manual sales-entry fallback. |
| **Staff resist the system** because it's "more work" | Make staff screens demonstrably faster than paper. Time-log clock-in must be < 5 sec from app open to logged. |
| **Compliance gaps** because someone didn't tick the box | Push notifications + dashboard red flags for missed temp logs / overdue training / etc. |
| **GDPR / data leak** with customer data | Encrypt at rest (Supabase does this); explicit opt-in for marketing; honour delete requests. |
| **Owner can't get their data out** if system fails | "Export all" CSV exists in Aurora; extend to per-table backup. |
| **PAYE confusion** — owner thinks the wage feature replaces payroll | Make clear in onboarding that PAYE/NI/RTI is HMRC-only via proper payroll software. This system tracks gross-pay liability. |

---

## 12. Out of scope (be explicit)

To keep v1 buildable:

- ❌ Proper PAYE / HMRC RTI submissions — use BrightPay / Xero Payroll
- ❌ Pension auto-enrolment admin — use Smart / NEST / Aviva
- ❌ Full kitchen display system — kitchen sees tickets from POS
- ❌ Multi-currency
- ❌ Multi-language UI
- ❌ Inventory transfer between sites (v2 if multi-site)
- ❌ Replacing the till hardware itself
- ❌ Food delivery integration (Deliveroo / Uber Eats / Just Eat)
- ❌ Music licensing (PRS / PPL)

---

## 13. Glossary

- **EHO** — Environmental Health Officer; local authority inspector.
- **HACCP** — Hazard Analysis and Critical Control Points; mandatory food safety framework.
- **PPDS** — Prepacked for Direct Sale; food made on-site, packaged, then sold (e.g. wrapped sandwiches). Subject to Natasha's Law full-ingredient labelling.
- **MTD** — Making Tax Digital; HMRC requirement to file VAT (and soon Income Tax) returns via API.
- **RIDDOR** — Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013.
- **GP%** — Gross Profit %, ((Sell price − cost) / Sell price) × 100. Cafes target 65-75% on drinks, 50-65% on food.
- **GRN** — Goods Received Note; record of what physically arrived from a supplier vs what was ordered.
- **Tronc** — Pooled tips, distributed among staff. Has specific tax treatment in the UK.
- **FHRS** — Food Hygiene Rating Scheme; 0–5 score displayed in window after EHO inspection.

---

_Brief drafted 2026-05-20 against Aurora system at commit `acfb832`. Pair with [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md)._
