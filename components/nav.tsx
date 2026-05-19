"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Banknote, FileText, FileSignature, Building2, BookOpen, Landmark, Scale, Settings as SettingsIcon } from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/takings", label: "Income", icon: Banknote },
  { href: "/quotes", label: "Quotes", icon: FileSignature },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/contacts", label: "Contacts", icon: Building2 },
  { href: "/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/directors-loan", label: "Director's loan", icon: Scale },
  { href: "/bank", label: "Bank", icon: Landmark },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="no-print bg-white border-b border-brand-line">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-3.5 text-sm font-semibold flex items-center gap-2 border-b-[3px] transition-colors ${
                active
                  ? "bg-brand-blue text-white border-brand-orange"
                  : "text-brand-ink hover:bg-brand-blue/5 border-transparent"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
