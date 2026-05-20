import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { PotsView } from "@/components/pots-view";
import { computeTotals, estimateCorporationTax, mileageClaim, vatPot } from "@/lib/reports";
import type {
  DirectorLoan, Expense, Invoice, Mileage, PotAllocation, Settings, Taking,
} from "@/lib/types";

export default async function PotsPage() {
  const supabase = await createClient();
  const [
    { data: exps },
    { data: invs },
    { data: tks },
    { data: dls },
    { data: mil },
    { data: settings },
    { data: allocations },
  ] = await Promise.all([
    supabase.from("expenses").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("takings").select("*"),
    supabase.from("director_loans").select("*"),
    supabase.from("mileage_logs").select("*"),
    supabase.from("settings").select("*").single(),
    supabase.from("pot_allocations").select("*").order("date", { ascending: false }),
  ]);

  const s = settings as Settings;
  const ctRate = Number(s?.corporation_tax_rate ?? 19);

  const totals = computeTotals({
    expenses: (exps ?? []) as Expense[],
    invoices: (invs ?? []) as Invoice[],
    takings: (tks ?? []) as Taking[],
    loans: (dls ?? []) as DirectorLoan[],
  });

  const obligations = {
    mileage: mileageClaim((mil ?? []) as Mileage[]),
    vat: vatPot((invs ?? []) as Invoice[]),
    tax: Math.max(estimateCorporationTax(totals.netProfit, ctRate), 0),
  };

  const vatRegistered = !!(s?.vat_number?.trim());

  return (
    <div>
      <PageHeader
        title="Pots"
        subtitle="Calculated obligation vs what you've actually set aside in Monzo. Click 'Move to pot' once you've shifted the money in real life."
      />
      <PotsView
        obligations={obligations}
        allocations={(allocations ?? []) as PotAllocation[]}
        vatRegistered={vatRegistered}
        ctRate={ctRate}
      />
    </div>
  );
}
