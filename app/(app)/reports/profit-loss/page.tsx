import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PeriodPicker } from "@/components/period-picker";
import { periodRange, periodLabel } from "@/lib/period";
import { computeTotals } from "@/lib/reports";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@/lib/types";
import type { Expense, Invoice, Taking, DirectorLoan } from "@/lib/types";
import { fmtGBP } from "@/lib/utils";

export default async function ProfitLossPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period ?? "this-month";
  const { from, to } = periodRange(period);

  const supabase = await createClient();
  const [{ data: exps }, { data: invs }, { data: tks }, { data: dls }] = await Promise.all([
    supabase.from("expenses").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("takings").select("*"),
    supabase.from("director_loans").select("*"),
  ]);

  const totals = computeTotals({
    expenses: (exps ?? []) as Expense[],
    invoices: (invs ?? []) as Invoice[],
    takings: (tks ?? []) as Taking[],
    loans: (dls ?? []) as DirectorLoan[],
    from,
    to,
  });

  const catRows = EXPENSE_CATEGORIES
    .map((c) => ({ ...c, value: totals.expensesByCategory[c.id] || 0 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div>
      <PageHeader
        title="Profit & Loss"
        subtitle={`${periodLabel(period)}${from && to ? ` · ${from} to ${to}` : ""}`}
        action={<PeriodPicker current={period} />}
      />

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden mb-5">
        <div className="px-6 py-4 bg-brand-cream border-b border-brand-line">
          <h3 className="text-xs font-bold tracking-wide text-brand-ink-soft uppercase">Revenue</h3>
        </div>
        <Row label="Takings (cash, SumUp, Square, etc.)" value={totals.takings} />
        <Row label="Paid invoices" value={totals.paidInvoices} />
        <Row label="Total revenue" value={totals.income} bold />
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden mb-5">
        <div className="px-6 py-4 bg-brand-cream border-b border-brand-line">
          <h3 className="text-xs font-bold tracking-wide text-brand-ink-soft uppercase">Expenses</h3>
        </div>
        {catRows.length === 0 ? (
          <Row label="No expenses in period" value={0} muted />
        ) : (
          catRows.map((c) => (
            <Row key={c.id} label={expenseCategoryLabel(c.id)} value={-c.value} accentColor={c.color} />
          ))
        )}
        <Row label="Total expenses" value={-totals.expensesTotal} bold />
      </div>

      <div className={`border-2 rounded-2xl overflow-hidden ${totals.netProfit >= 0 ? "border-brand-blue bg-brand-blue/5" : "border-brand-orange bg-brand-orange-soft"}`}>
        <div className="px-6 py-5 flex justify-between items-center">
          <h3 className="heading-display text-lg">{totals.netProfit >= 0 ? "Net profit" : "Net loss"}</h3>
          <span className={`heading-display text-2xl ${totals.netProfit >= 0 ? "text-brand-blue" : "text-brand-orange"}`}>
            {fmtGBP(totals.netProfit)}
          </span>
        </div>
      </div>

      <div className="mt-6 text-xs text-brand-ink-soft">
        Director&apos;s loan movements are not included in profit (they&apos;re balance-sheet, not P&amp;L).
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted, accentColor }: { label: string; value: number; bold?: boolean; muted?: boolean; accentColor?: string }) {
  return (
    <div className="px-6 py-3 flex justify-between items-center border-b border-brand-line last:border-0">
      <div className="flex items-center gap-2">
        {accentColor && <span className="w-2 h-2 rounded-full" style={{ background: accentColor }} />}
        <span className={`text-sm ${bold ? "font-bold" : muted ? "text-brand-ink-soft" : ""}`}>{label}</span>
      </div>
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : muted ? "text-brand-ink-soft" : ""}`}>
        {fmtGBP(value)}
      </span>
    </div>
  );
}
