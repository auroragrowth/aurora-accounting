import Link from "next/link";
import { TrendingDown, Banknote, Landmark, AlertCircle, Plus, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Card, EmptyState, StatusPill } from "@/components/ui";
import { ExportAllButton } from "@/components/export-all-button";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@/lib/types";
import type { DirectorLoan, Expense, Invoice, Taking } from "@/lib/types";
import { fmtGBP, fmtDate, invoiceTotal } from "@/lib/utils";

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="stat-card bg-white border border-brand-line rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-brand-ink-soft font-semibold uppercase tracking-wide">{label}</span>
        <div
          className="w-9 h-9 rounded-[10px] grid place-items-center"
          style={{ background: `${accent}15`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="heading-display text-2xl text-brand-ink mb-1">{value}</div>
      <div className="text-xs text-brand-ink-soft">{sub}</div>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: expenses }, { data: invoices }, { data: takings }, { data: loans }] = await Promise.all([
    supabase.from("expenses").select("*").order("date", { ascending: false }),
    supabase.from("invoices").select("*").order("date", { ascending: false }),
    supabase.from("takings").select("*").order("date", { ascending: false }),
    supabase.from("director_loans").select("*").order("date", { ascending: false }),
  ]);

  const exps = (expenses ?? []) as Expense[];
  const invs = (invoices ?? []) as Invoice[];
  const tks = (takings ?? []) as Taking[];
  const dls = (loans ?? []) as DirectorLoan[];

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthExpenses = exps.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const totalMonthExp = monthExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalAllExp = exps.reduce((s, e) => s + Number(e.amount), 0);
  const invoiced = invs.reduce((s, i) => s + invoiceTotal(i), 0);
  const paid = invs.filter((i) => i.status === "paid").reduce((s, i) => s + invoiceTotal(i), 0);
  const outstanding = invs
    .filter((i) => i.status !== "paid" && i.status !== "draft")
    .reduce((s, i) => s + invoiceTotal(i), 0);

  const takingsTotal = tks.reduce((s, t) => s + Number(t.amount), 0);
  const dlIn = dls.filter((l) => l.direction === "in").reduce((s, l) => s + Number(l.amount), 0);
  const dlOut = dls.filter((l) => l.direction === "out").reduce((s, l) => s + Number(l.amount), 0);
  const income = takingsTotal + paid;
  const outgoings = totalAllExp;
  // Bank balance: cash flows include director's loan movements
  const leftInBank = income + dlIn - outgoings - dlOut;
  const paidCount = invs.filter((i) => i.status === "paid").length;

  const byCategory: Record<string, number> = {};
  monthExpenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
  });
  const cats = EXPENSE_CATEGORIES
    .map((c) => ({ ...c, value: byCategory[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`${now.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} overview`}
        action={<ExportAllButton expenses={exps} takings={tks} invoices={invs} loans={dls} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<Banknote size={20} />}
          label="Income"
          value={fmtGBP(income)}
          sub={`${tks.length} takings + ${paidCount} paid invoices`}
          accent="#0F8A6B"
        />
        <StatCard
          icon={<TrendingDown size={20} />}
          label="Outgoings"
          value={fmtGBP(outgoings)}
          sub={`${exps.length} expenses · ${fmtGBP(totalMonthExp)} this month`}
          accent="#E8551C"
        />
        <StatCard
          icon={<Landmark size={20} />}
          label="Left in the bank"
          value={fmtGBP(leftInBank)}
          sub="Income + DL in − outgoings − DL out"
          accent={leftInBank < 0 ? "#C9410B" : "#173F87"}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Outstanding"
          value={fmtGBP(outstanding)}
          sub={`${invs.filter((i) => i.status !== "paid" && i.status !== "draft").length} unpaid · ${fmtGBP(invoiced)} invoiced`}
          accent="#BD8B00"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <Card title="Spending by category — this month">
          {cats.length === 0 ? (
            <EmptyState text="No expenses logged this month yet." />
          ) : (
            <div>
              {cats.map((cat) => {
                const pct = (cat.value / totalMonthExp) * 100;
                return (
                  <div key={cat.id} className="mb-3.5">
                    <div className="flex justify-between mb-1.5 text-sm">
                      <span className="font-semibold">{cat.label}</span>
                      <span className="text-brand-ink-soft">{fmtGBP(cat.value)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-brand-line rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Quick actions">
          <div className="flex flex-col gap-2.5">
            <Link href="/expenses" className="btn-primary justify-start">
              <Plus size={16} /> Log new expense
            </Link>
            <Link href="/invoices" className="btn-primary justify-start">
              <Plus size={16} /> Create new invoice
            </Link>
            <Link href="/settings" className="btn-secondary justify-start">
              <SettingsIcon size={16} /> Company settings
            </Link>
          </div>
          <div className="mt-6 p-4 bg-brand-orange-soft rounded-xl text-sm">
            <strong>All-time totals</strong>
            <div className="mt-1.5 text-brand-ink-soft">
              {fmtGBP(totalAllExp)} expensed across {exps.length} entries
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          title="Recent expenses"
          action={
            <Link href="/expenses" className="btn-ghost">
              View all <ChevronRight size={14} />
            </Link>
          }
        >
          {exps.length === 0 ? (
            <EmptyState text="No expenses yet." />
          ) : (
            <div>
              {exps.slice(0, 5).map((e) => (
                <div key={e.id} className="flex justify-between py-2.5 border-b border-brand-line last:border-0">
                  <div>
                    <div className="font-semibold text-sm">{e.vendor}</div>
                    <div className="text-xs text-brand-ink-soft">
                      {fmtDate(e.date)} · {expenseCategoryLabel(e.category)}
                    </div>
                  </div>
                  <div className="font-bold">{fmtGBP(e.amount)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Recent invoices"
          action={
            <Link href="/invoices" className="btn-ghost">
              View all <ChevronRight size={14} />
            </Link>
          }
        >
          {invs.length === 0 ? (
            <EmptyState text="No invoices yet." />
          ) : (
            <div>
              {invs.slice(0, 5).map((i) => (
                <div key={i.id} className="flex justify-between items-center py-2.5 border-b border-brand-line last:border-0">
                  <div>
                    <div className="font-semibold text-sm">{i.invoice_number}</div>
                    <div className="text-xs text-brand-ink-soft">
                      {i.customer_snapshot?.name ?? "No name"} · {fmtDate(i.date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmtGBP(invoiceTotal(i))}</div>
                    <StatusPill status={i.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
