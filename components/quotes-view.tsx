"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit3, Trash2, Eye } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { QuoteForm } from "./quote-form";
import { useToast } from "./toast-provider";
import type { Customer, LineItemPreset, Quote, QuoteStatus, Settings } from "@/lib/types";
import { fmtGBP, fmtDate, invoiceTotal } from "@/lib/utils";
import { deleteQuote } from "@/app/(app)/quotes/actions";

const QUOTE_STATUS_COLOURS: Record<QuoteStatus, { bg: string; fg: string; label: string }> = {
  draft:    { bg: "#E5E7EB", fg: "#374151", label: "Draft" },
  sent:     { bg: "#DBEAFE", fg: "#1E40AF", label: "Sent" },
  accepted: { bg: "#D1FAE5", fg: "#065F46", label: "Accepted" },
  declined: { bg: "#FEE2E2", fg: "#991B1B", label: "Declined" },
  expired:  { bg: "#FEF3C7", fg: "#92400E", label: "Expired" },
};

function QuoteStatusPill({ status }: { status: QuoteStatus }) {
  const c = QUOTE_STATUS_COLOURS[status];
  return (
    <span className="pill" style={{ background: c.bg, color: c.fg }}>
      {c.label}
    </span>
  );
}

export function QuotesView({
  quotes,
  customers,
  settings,
  presets,
}: {
  quotes: Quote[];
  customers: Customer[];
  settings: Settings;
  presets: LineItemPreset[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      quotes.filter((q) => {
        if (filterStatus !== "all" && q.status !== filterStatus) return false;
        if (search && !`${q.quote_number} ${q.customer_snapshot?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [quotes, search, filterStatus]
  );

  const totalSum = filtered.reduce((s, q) => s + invoiceTotal(q), 0);

  async function handleDelete(q: Quote) {
    if (!confirm(`Delete quote ${q.quote_number}?`)) return;
    const res = await deleteQuote(q.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Quote deleted");
  }

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle={`${filtered.length} quotes · ${fmtGBP(totalSum)} total`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New quote
          </button>
        }
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
          <input
            className="input pl-10"
            placeholder="Search quote number or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: "auto", minWidth: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            text={quotes.length === 0 ? "No quotes yet. Create your first quote to send to a prospective client." : "No quotes match your filters."}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Quote #</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Valid until</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                  <Td><strong>{q.quote_number}</strong></Td>
                  <Td>{fmtDate(q.date)}</Td>
                  <Td>{q.customer_snapshot?.name || "—"}</Td>
                  <Td>{fmtDate(q.valid_until)}</Td>
                  <Td><QuoteStatusPill status={q.status} /></Td>
                  <Td className="text-right font-bold">{fmtGBP(invoiceTotal(q))}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <Link className="btn-ghost" href={`/quotes/${q.id}`}>
                        <Eye size={14} />
                      </Link>
                      <button className="btn-ghost" onClick={() => { setEditing(q); setShowForm(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(q)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <QuoteForm
          initial={editing}
          customers={customers}
          settings={settings}
          presets={presets}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
