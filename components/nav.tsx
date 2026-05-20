"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Receipt, Banknote, FileText, FileSignature, Building2,
  BookOpen, Landmark, Scale, Car, BarChart3, PiggyBank,
  Settings as SettingsIcon, Menu, X,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/takings", label: "Income", icon: Banknote },
  { href: "/mileage", label: "Mileage", icon: Car },
  { href: "/quotes", label: "Quotes", icon: FileSignature },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/contacts", label: "Contacts", icon: Building2 },
  { href: "/catalogue", label: "Catalogue", icon: BookOpen },
  { href: "/directors-loan", label: "Director's loan", icon: Scale },
  { href: "/bank", label: "Bank", icon: Landmark },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/pots", label: "Pots", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = TABS.find((t) => pathname.startsWith(t.href));
  const CurrentIcon = current?.icon;

  return (
    <nav className="no-print bg-white border-b border-brand-line">
      <div className="max-w-6xl mx-auto px-6">
        {/* Mobile: current page label + hamburger toggle */}
        <div className="flex items-center justify-between py-3 md:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-ink">
            {CurrentIcon && <CurrentIcon size={16} className="text-brand-blue" />}
            <span>{current?.label ?? "Menu"}</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="p-2 -mr-2 text-brand-ink hover:text-brand-blue"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile: collapsible nav items in a 2-col grid */}
        {open && (
          <div className="md:hidden pb-3 -mt-1 grid grid-cols-2 gap-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setOpen(false)}
                  className={`px-3 py-2.5 text-sm font-semibold rounded-md flex items-center gap-2 transition-colors ${
                    active
                      ? "bg-brand-blue text-white"
                      : "text-brand-ink hover:bg-brand-blue/5"
                  }`}
                >
                  <Icon size={16} />
                  <span className="truncate">{tab.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Desktop: horizontal tab bar */}
        <div className="hidden md:flex flex-wrap gap-1">
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
      </div>
    </nav>
  );
}
