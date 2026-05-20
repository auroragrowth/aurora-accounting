import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState, Th, Td } from "@/components/ui";
import { rollupByEvent } from "@/lib/reports";
import type { Expense, Mileage, Taking } from "@/lib/types";
import { fmtGBP } from "@/lib/utils";

export default async function EventsReportPage() {
  const supabase = await createClient();
  const [{ data: tks }, { data: exps }, { data: mil }] = await Promise.all([
    supabase.from("takings").select("*"),
    supabase.from("expenses").select("*"),
    supabase.from("mileage_logs").select("*"),
  ]);

  const { events, untagged } = rollupByEvent({
    takings: (tks ?? []) as Taking[],
    expenses: (exps ?? []) as Expense[],
    mileage: (mil ?? []) as Mileage[],
  });

  const hasUntagged = untagged.takings > 0 || untagged.expenses > 0 || untagged.mileage > 0;

  return (
    <div>
      <PageHeader
        title="Per-event profitability"
        subtitle="Tag takings, expenses and mileage with an event name to see net per event."
      />

      {events.length === 0 && !hasUntagged ? (
        <div className="bg-white border border-brand-line rounded-2xl">
          <EmptyState text="No events tagged yet. Add an Event name when logging takings, expenses, or mileage." />
        </div>
      ) : (
        <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Event</Th>
                <Th className="text-right">Takings</Th>
                <Th className="text-right">Expenses</Th>
                <Th className="text-right">Mileage</Th>
                <Th className="text-right">Net</Th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.name} className="border-b border-brand-line last:border-0">
                  <Td>
                    <strong>{e.name}</strong>
                    <div className="text-[11px] text-brand-ink-soft mt-0.5">
                      {e.takingsCount} taking · {e.expensesCount} expense · {e.mileageMiles.toFixed(0)} mi
                    </div>
                  </Td>
                  <Td className="text-right text-brand-green font-semibold">{fmtGBP(e.takings)}</Td>
                  <Td className="text-right text-brand-orange font-semibold">{fmtGBP(-e.expenses)}</Td>
                  <Td className="text-right text-brand-orange font-semibold">{fmtGBP(-e.mileage)}</Td>
                  <Td className={`text-right font-bold ${e.net >= 0 ? "text-brand-blue" : "text-brand-orange"}`}>
                    {fmtGBP(e.net)}
                  </Td>
                </tr>
              ))}
              {hasUntagged && (
                <tr className="bg-brand-cream/40">
                  <Td className="text-brand-ink-soft">
                    <em>{untagged.name}</em>
                    <div className="text-[11px] mt-0.5">
                      {untagged.takingsCount} taking · {untagged.expensesCount} expense · {untagged.mileageMiles.toFixed(0)} mi
                    </div>
                  </Td>
                  <Td className="text-right text-brand-ink-soft">{fmtGBP(untagged.takings)}</Td>
                  <Td className="text-right text-brand-ink-soft">{fmtGBP(-untagged.expenses)}</Td>
                  <Td className="text-right text-brand-ink-soft">{fmtGBP(-untagged.mileage)}</Td>
                  <Td className="text-right text-brand-ink-soft font-semibold">{fmtGBP(untagged.net)}</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 text-xs text-brand-ink-soft">
        Tip: tag any expense to an event via the Event field in the expense form. Mileage and takings already support the tag.
      </div>
    </div>
  );
}
