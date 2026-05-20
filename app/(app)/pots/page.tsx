import Link from "next/link";
import { Calculator, Car, Percent, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { computeTotals, estimateCorporationTax, mileageClaim, vatPot } from "@/lib/reports";
import type { DirectorLoan, Expense, Invoice, Mileage, Settings, Taking } from "@/lib/types";
import { fmtGBP } from "@/lib/utils";

export default async function PotsPage() {
  const supabase = await createClient();
  const [{ data: exps }, { data: invs }, { data: tks }, { data: dls }, { data: mil }, { data: settings }] = await Promise.all([
    supabase.from("expenses").select("*"),
    supabase.from("invoices").select("*"),
    supabase.from("takings").select("*"),
    supabase.from("director_loans").select("*"),
    supabase.from("mileage_logs").select("*"),
    supabase.from("settings").select("*").single(),
  ]);

  const s = settings as Settings;
  const ctRate = Number(s?.corporation_tax_rate ?? 19);

  const totals = computeTotals({
    expenses: (exps ?? []) as Expense[],
    invoices: (invs ?? []) as Invoice[],
    takings: (tks ?? []) as Taking[],
    loans: (dls ?? []) as DirectorLoan[],
  });

  const milPot = mileageClaim((mil ?? []) as Mileage[]);
  const vatRegistered = !!(s?.vat_number?.trim());
  const vatOwed = vatPot((invs ?? []) as Invoice[]);
  const tax = estimateCorporationTax(totals.netProfit, ctRate);
  const total = milPot + (vatRegistered ? vatOwed : 0) + Math.max(tax, 0);

  return (
    <div>
      <PageHeader
        title="Pots"
        subtitle="Money to set aside, mirrored to Monzo pots. Calculated from your data."
      />

      <div className="bg-brand-blue text-white rounded-2xl p-6 mb-6">
        <div className="text-xs font-bold tracking-widest opacity-80 uppercase">Total to set aside</div>
        <div className="heading-display text-4xl mt-2">{fmtGBP(total)}</div>
        <div className="text-sm opacity-80 mt-2">
          Across mileage, VAT and corporation tax. Move this much into Monzo pots and the company&apos;s available cash matches what&apos;s yours to spend.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <PotCard
          title="Mileage pot"
          icon={<Car size={20} />}
          accent="#7A4DBF"
          amount={milPot}
          blurb="Mileage allowance the company owes you (the director)."
          detail={
            milPot > 0
              ? `${(milPot / 0.45).toFixed(0)}+ miles logged at HMRC rates. This money is reclaimable from the company.`
              : "No mileage logged yet."
          }
          href="/mileage"
          ctaLabel="Open mileage log"
        />
        <PotCard
          title="VAT pot"
          icon={<Percent size={20} />}
          accent="#0F8A6B"
          amount={vatRegistered ? vatOwed : 0}
          blurb={vatRegistered ? "Output VAT on paid invoices. (Input VAT on receipts will be subtracted when added to expenses.)" : "Not VAT-registered yet. Once you register, fill in VAT number in Settings and this pot will start tracking."}
          detail={vatRegistered ? "Owed to HMRC at the next VAT return." : "Currently inactive."}
          href="/settings"
          ctaLabel={vatRegistered ? "Open settings" : "Set VAT number"}
        />
        <PotCard
          title="Tax pot"
          icon={<Calculator size={20} />}
          accent="#E8551C"
          amount={Math.max(tax, 0)}
          blurb={`Corporation tax at ${ctRate}% on net profit to date.`}
          detail={totals.netProfit > 0
            ? `Net profit to date ${fmtGBP(totals.netProfit)}. Set aside ${fmtGBP(tax)}.`
            : "No profit yet — no tax owed."}
          href="/reports/tax"
          ctaLabel="Open tax estimate"
        />
      </div>

      <div className="mt-6 text-xs text-brand-ink-soft">
        These numbers are calculated live from your records. Update them in Monzo as the figures change — the system won&apos;t auto-move money for you.
      </div>
    </div>
  );
}

function PotCard({
  title, icon, accent, amount, blurb, detail, href, ctaLabel,
}: {
  title: string; icon: React.ReactNode; accent: string; amount: number;
  blurb: string; detail: string; href: string; ctaLabel: string;
}) {
  return (
    <div className="bg-white border-2 rounded-2xl p-5" style={{ borderColor: accent }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-brand-ink">{title}</h3>
        <div className="w-10 h-10 rounded-[10px] grid place-items-center" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>
      <div className="heading-display text-3xl mb-1" style={{ color: accent }}>{fmtGBP(amount)}</div>
      <p className="text-xs text-brand-ink-soft mb-3">{blurb}</p>
      <p className="text-xs text-brand-ink-soft mb-4">{detail}</p>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: accent }}>
        {ctaLabel} <ChevronRight size={14} />
      </Link>
    </div>
  );
}
