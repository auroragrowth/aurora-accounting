import Link from "next/link";
import { ChevronRight, BarChart3, CalendarDays, Coins, Calculator } from "lucide-react";
import { PageHeader } from "@/components/ui";

const REPORTS = [
  { href: "/reports/profit-loss", label: "Profit & Loss", icon: BarChart3, blurb: "Revenue, expenses by category, and net profit for a period." },
  { href: "/reports/events", label: "Per-event profitability", icon: CalendarDays, blurb: "How much each event made after costs and mileage." },
  { href: "/reports/cash-float", label: "Cash float", icon: Coins, blurb: "Cash takings vs cash-paid expenses — what's in the till." },
  { href: "/reports/tax", label: "Tax estimate", icon: Calculator, blurb: "Corporation tax to set aside, based on profit to date." },
];

export default function ReportsHubPage() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Profit, per-event performance, cash and tax." />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          return (
            <Link
              key={r.href}
              href={r.href}
              className="bg-white border border-brand-line rounded-2xl p-5 hover:border-brand-orange transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[10px] grid place-items-center bg-brand-blue/10 text-brand-blue">
                  <Icon size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-brand-ink">{r.label}</h3>
                    <ChevronRight size={16} className="text-brand-ink-soft" />
                  </div>
                  <p className="text-sm text-brand-ink-soft mt-1">{r.blurb}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
