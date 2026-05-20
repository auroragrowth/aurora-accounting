import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, Th, Td } from "@/components/ui";
import type { Expense, Taking } from "@/lib/types";
import { fmtGBP, fmtDate } from "@/lib/utils";

export default async function CashFloatPage() {
  const supabase = await createClient();
  const [{ data: tks }, { data: exps }] = await Promise.all([
    supabase.from("takings").select("*").order("date", { ascending: false }),
    supabase.from("expenses").select("*").order("date", { ascending: false }),
  ]);

  const cashIn = ((tks ?? []) as Taking[]).filter((t) => t.source === "cash");
  const cashOut = ((exps ?? []) as Expense[]).filter((e) => e.payment_method === "cash");
  const inTotal = cashIn.reduce((s, t) => s + Number(t.amount), 0);
  const outTotal = cashOut.reduce((s, e) => s + Number(e.amount), 0);
  const balance = inTotal - outTotal;

  return (
    <div>
      <PageHeader
        title="Cash float"
        subtitle="Cash takings vs cash-paid expenses. The float doesn't go through the bank — it's the physical till."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Tile label="Cash in" value={fmtGBP(inTotal)} sub={`${cashIn.length} takings · source = Cash`} accent="#0F8A6B" />
        <Tile label="Cash out" value={fmtGBP(outTotal)} sub={`${cashOut.length} expenses · paid = Cash`} accent="#E8551C" />
        <Tile label="Cash in till" value={fmtGBP(balance)} sub={balance >= 0 ? "Owed to the company" : "Float overdrawn"} accent={balance >= 0 ? "#173F87" : "#C9410B"} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-brand-cream border-b border-brand-line flex justify-between items-center">
            <h3 className="text-base font-bold">Cash takings</h3>
            <span className="text-sm text-brand-green font-bold">{fmtGBP(inTotal)}</span>
          </div>
          {cashIn.length === 0 ? (
            <EmptyState text="No cash takings yet. Add a Taking with source = Cash." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-line">
                  <Th>Date</Th>
                  <Th>Event / Notes</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {cashIn.map((t) => (
                  <tr key={t.id} className="border-b border-brand-line last:border-0">
                    <Td>{fmtDate(t.date)}</Td>
                    <Td>{t.event_name || t.description || "—"}</Td>
                    <Td className="text-right text-brand-green font-semibold">{fmtGBP(t.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-brand-cream border-b border-brand-line flex justify-between items-center">
            <h3 className="text-base font-bold">Cash-paid expenses</h3>
            <span className="text-sm text-brand-orange font-bold">−{fmtGBP(outTotal)}</span>
          </div>
          {cashOut.length === 0 ? (
            <EmptyState text="No cash expenses yet. Set payment method = Cash on an expense." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-line">
                  <Th>Date</Th>
                  <Th>Vendor</Th>
                  <Th className="text-right">Amount</Th>
                </tr>
              </thead>
              <tbody>
                {cashOut.map((e) => (
                  <tr key={e.id} className="border-b border-brand-line last:border-0">
                    <Td>{fmtDate(e.date)}</Td>
                    <Td>{e.vendor}</Td>
                    <Td className="text-right text-brand-orange font-semibold">−{fmtGBP(e.amount)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-brand-ink-soft">
        To move cash into the bank, record a paying-in slip as a Taking with source = Bank transfer, then add a matching cash-out expense (or the reverse).
      </div>
    </div>
  );
}

function Tile({ label, value, sub, accent, highlight }: { label: string; value: string; sub: string; accent: string; highlight?: boolean }) {
  return (
    <div className={`stat-card border rounded-2xl p-5 ${highlight ? "border-2 bg-brand-cream" : "border-brand-line bg-white"}`}
         style={highlight ? { borderColor: accent } : undefined}>
      <span className="text-xs text-brand-ink-soft font-semibold uppercase tracking-wide">{label}</span>
      <div className="heading-display text-2xl mt-2" style={{ color: highlight ? accent : undefined }}>{value}</div>
      <div className="text-xs text-brand-ink-soft mt-1">{sub}</div>
    </div>
  );
}
