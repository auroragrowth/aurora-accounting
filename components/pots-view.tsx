"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, Car, Percent, ChevronRight, Plus, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "./toast-provider";
import { PotAllocateModal } from "./pot-allocate-modal";
import type { PotAllocation, PotKind } from "@/lib/types";
import { fmtGBP, fmtDate } from "@/lib/utils";
import { deletePotAllocation } from "@/app/(app)/pots/actions";

type Obligations = { mileage: number; vat: number; tax: number };

const POT_LABELS: Record<PotKind, string> = {
  mileage: "Mileage pot",
  vat: "VAT pot",
  tax: "Tax pot",
};

export function PotsView({
  obligations,
  allocations,
  vatRegistered,
  ctRate,
}: {
  obligations: Obligations;
  allocations: PotAllocation[];
  vatRegistered: boolean;
  ctRate: number;
}) {
  const [allocating, setAllocating] = useState<PotKind | null>(null);
  const { showToast } = useToast();

  const allocatedBy = useMemo(() => {
    const m: Record<PotKind, number> = { mileage: 0, vat: 0, tax: 0 };
    for (const a of allocations) m[a.pot] += Number(a.amount);
    return m;
  }, [allocations]);

  const remaining = {
    mileage: obligations.mileage - allocatedBy.mileage,
    vat: (vatRegistered ? obligations.vat : 0) - allocatedBy.vat,
    tax: obligations.tax - allocatedBy.tax,
  };
  const totalRemaining = remaining.mileage + remaining.vat + remaining.tax;

  async function handleDelete(a: PotAllocation) {
    if (!confirm(`Remove this ${fmtGBP(a.amount)} allocation from ${POT_LABELS[a.pot]}?`)) return;
    const res = await deletePotAllocation(a.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Allocation removed");
  }

  return (
    <>
      <div className="bg-brand-blue text-white rounded-2xl p-6 mb-6">
        <div className="text-xs font-bold tracking-widest opacity-80 uppercase">Still to move into pots</div>
        <div className="heading-display text-4xl mt-2">{fmtGBP(Math.max(totalRemaining, 0))}</div>
        <div className="text-sm opacity-80 mt-2">
          Calculated obligation across all three pots, minus what you&apos;ve already allocated.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <PotCard
          kind="mileage"
          title="Mileage pot"
          icon={<Car size={20} />}
          accent="#7A4DBF"
          obligation={obligations.mileage}
          allocated={allocatedBy.mileage}
          remaining={remaining.mileage}
          blurb="HMRC mileage allowance the company owes you."
          href="/mileage"
          ctaLabel="Open mileage log"
          enabled
          onAllocate={() => setAllocating("mileage")}
        />
        <PotCard
          kind="vat"
          title="VAT pot"
          icon={<Percent size={20} />}
          accent="#0F8A6B"
          obligation={vatRegistered ? obligations.vat : 0}
          allocated={allocatedBy.vat}
          remaining={remaining.vat}
          blurb={vatRegistered ? "Output VAT on paid invoices." : "Not VAT-registered yet. Set a VAT number in Settings to activate."}
          href={vatRegistered ? "/invoices" : "/settings"}
          ctaLabel={vatRegistered ? "Open invoices" : "Set VAT number"}
          enabled={vatRegistered}
          onAllocate={() => setAllocating("vat")}
        />
        <PotCard
          kind="tax"
          title="Tax pot"
          icon={<Calculator size={20} />}
          accent="#E8551C"
          obligation={obligations.tax}
          allocated={allocatedBy.tax}
          remaining={remaining.tax}
          blurb={`Corporation tax at ${ctRate}% on net profit.`}
          href="/reports/tax"
          ctaLabel="Open tax estimate"
          enabled
          onAllocate={() => setAllocating("tax")}
        />
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-brand-cream border-b border-brand-line">
          <h3 className="text-base font-bold">Recent allocations</h3>
        </div>
        {allocations.length === 0 ? (
          <div className="py-10 text-center text-sm text-brand-ink-soft">
            No allocations recorded yet. After moving money into a Monzo pot, click &quot;Move to pot&quot; on the card above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide">Pot</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide">Note</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-brand-ink-soft tracking-wide">Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((a) => (
                <tr key={a.id} className="border-b border-brand-line last:border-0">
                  <td className="px-4 py-3 text-sm">{fmtDate(a.date)}</td>
                  <td className="px-4 py-3 text-sm">{POT_LABELS[a.pot]}</td>
                  <td className="px-4 py-3 text-sm text-brand-ink-soft">{a.note || "—"}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">{fmtGBP(a.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button className="btn-danger" onClick={() => handleDelete(a)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {allocating && (
        <PotAllocateModal
          pot={allocating}
          potLabel={POT_LABELS[allocating]}
          suggested={Math.max(remaining[allocating], 0)}
          onClose={() => setAllocating(null)}
        />
      )}
    </>
  );
}

function PotCard({
  title, icon, accent, obligation, allocated, remaining, blurb, href, ctaLabel, enabled, onAllocate,
}: {
  kind: PotKind;
  title: string;
  icon: React.ReactNode;
  accent: string;
  obligation: number;
  allocated: number;
  remaining: number;
  blurb: string;
  href: string;
  ctaLabel: string;
  enabled: boolean;
  onAllocate: () => void;
}) {
  const pct = obligation > 0 ? Math.min((allocated / obligation) * 100, 100) : 0;
  const fullyFunded = enabled && obligation > 0 && remaining <= 0.005;

  return (
    <div className="bg-white border-2 rounded-2xl p-5 flex flex-col" style={{ borderColor: accent }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-brand-ink">{title}</h3>
        <div className="w-10 h-10 rounded-[10px] grid place-items-center" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>

      <div className="text-xs text-brand-ink-soft uppercase tracking-wide font-semibold">Still to move</div>
      <div className="heading-display text-3xl mb-3" style={{ color: remaining > 0 ? accent : "#0F8A6B" }}>
        {fmtGBP(Math.max(remaining, 0))}
      </div>

      <div className="space-y-1 text-xs mb-3">
        <div className="flex justify-between">
          <span className="text-brand-ink-soft">Obligation</span>
          <span className="font-semibold">{fmtGBP(obligation)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-brand-ink-soft">In pot</span>
          <span className="font-semibold">{fmtGBP(allocated)}</span>
        </div>
      </div>

      <div className="h-2 bg-brand-line rounded-full overflow-hidden mb-3">
        <div className="h-full" style={{ width: `${pct}%`, background: accent }} />
      </div>

      <p className="text-xs text-brand-ink-soft mb-4 flex-1">{blurb}</p>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          className="btn-primary text-xs"
          onClick={onAllocate}
          disabled={!enabled}
          style={enabled ? { background: accent } : undefined}
        >
          <Plus size={12} /> {fullyFunded ? "Top up pot" : "Move to pot"}
        </button>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold ml-auto" style={{ color: accent }}>
          {ctaLabel} <ChevronRight size={14} />
        </Link>
      </div>
      {fullyFunded && (
        <div className="mt-3 text-xs text-brand-green flex items-center gap-1">
          <ArrowRight size={12} /> Fully funded for now
        </div>
      )}
    </div>
  );
}
