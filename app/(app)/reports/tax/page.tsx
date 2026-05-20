import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PeriodPicker, periodRange, periodLabel } from "@/components/period-picker";
import { computeTotals, estimateCorporationTax } from "@/lib/reports";
import type { DirectorLoan, Expense, Invoice, Settings, Taking } from "@/lib/types";
import { fmtGBP } from "@/lib/utils";

export default async function TaxReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  const period = sp.period ?? "this-year";
  const { from, to } = periodRange(period);

  const supabase = await createClient();
  const [{ data: exps }, { data: invs }, { data: tks }, { data: dls }, { data: settings }] = await Promise.all([
    supabase.from("expenses").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("takings").select("*"),
    supabase.from("director_loans").select("*"),
    supabase.from("settings").select("*").single(),
  ]);

  const s = settings as Settings;
  const ctRate = Number(s?.corporation_tax_rate ?? 19);

  const totals = computeTotals({
    expenses: (exps ?? []) as Expense[],
    invoices: (invs ?? []) as Invoice[],
    takings: (tks ?? []) as Taking[],
    loans: (dls ?? []) as DirectorLoan[],
    from,
    to,
  });

  const ct = estimateCorporationTax(totals.netProfit, ctRate);
  const setAside = Math.max(ct, 0);

  return (
    <div>
      <PageHeader
        title="Tax estimate"
        subtitle={`${periodLabel(period)} · Corporation tax at ${ctRate}%`}
        action={<PeriodPicker current={period} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Tile label="Revenue" value={fmtGBP(totals.income)} accent="#0F8A6B" />
        <Tile label="Expenses" value={fmtGBP(totals.expensesTotal)} accent="#E8551C" />
        <Tile label={totals.netProfit >= 0 ? "Net profit" : "Net loss"} value={fmtGBP(totals.netProfit)} accent={totals.netProfit >= 0 ? "#173F87" : "#C9410B"} highlight />
      </div>

      <div className="bg-brand-orange-soft border-2 border-brand-orange rounded-2xl p-6 mb-5">
        <div className="text-xs font-bold tracking-wide text-brand-orange uppercase">Set aside for corporation tax</div>
        <div className="heading-display text-4xl text-brand-orange mt-2">{fmtGBP(setAside)}</div>
        <div className="text-sm text-brand-ink-soft mt-2">
          {totals.netProfit > 0
            ? `${ctRate}% of net profit (${fmtGBP(totals.netProfit)}). Move this to a separate pot in Monzo and don't touch it.`
            : "No profit yet, so no corporation tax owed in this period."}
        </div>
      </div>

      <div className="text-xs text-brand-ink-soft space-y-2">
        <p>
          <strong>Reality check:</strong> this is an estimate based on profit-to-date in the selected period. Actual corporation tax is calculated on the company&apos;s accounting period and after allowable adjustments.
        </p>
        <p>
          Standard small-profits rate is 19% up to £50,000 profit, then a marginal band, rising to 25% above £250,000. Set the rate in Settings if you need a different figure.
        </p>
      </div>
    </div>
  );
}

function Tile({ label, value, accent, highlight }: { label: string; value: string; accent: string; highlight?: boolean }) {
  return (
    <div className={`stat-card border rounded-2xl p-5 ${highlight ? "border-2 bg-brand-cream" : "border-brand-line bg-white"}`}
         style={highlight ? { borderColor: accent } : undefined}>
      <span className="text-xs text-brand-ink-soft font-semibold uppercase tracking-wide">{label}</span>
      <div className="heading-display text-2xl mt-2" style={{ color: highlight ? accent : undefined }}>{value}</div>
    </div>
  );
}
