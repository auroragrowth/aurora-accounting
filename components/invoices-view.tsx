"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit3, Trash2, Eye } from "lucide-react";
import { PageHeader, EmptyState, Th, Td, StatusPill } from "./ui";
import { InvoiceForm } from "./invoice-form";
import { useToast } from "./toast-provider";
import type { Customer, Invoice, Settings } from "@/lib/types";
import { fmtGBP, fmtDate, invoiceTotal } from "@/lib/utils";
import { deleteInvoice } from "@/app/(app)/invoices/actions";

export function InvoicesView({
  invoices,
  customers,
  settings,
}: {
  invoices: Invoice[];
  customers: Customer[];
  settings: Settings;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      invoices.filter((i) => {
        if (filterStatus !== "all" && i.status !== filterStatus) return false;
        if (search && !`${i.invoice_number} ${i.customer_snapshot?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [invoices, search, filterStatus]
  );

  const totalSum = filtered.reduce((s, i) => s + invoiceTotal(i), 0);

  async function handleDelete(inv: Invoice) {
    if (!confirm(`Delete invoice ${inv.invoice_number}?`)) return;
    const res = await deleteInvoice(inv.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Invoice deleted");
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        subtitle={`${filtered.length} invoices · ${fmtGBP(totalSum)} total`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> New invoice
          </button>
        }
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
          <input
            className="input pl-10"
            placeholder="Search invoice number or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: "auto", minWidth: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            text={invoices.length === 0 ? "No invoices yet. Create your first to get started." : "No invoices match your filters."}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Invoice #</Th>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th className="text-right">Total</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                  <Td><strong>{inv.invoice_number}</strong></Td>
                  <Td>{fmtDate(inv.date)}</Td>
                  <Td>{inv.customer_snapshot?.name || "—"}</Td>
                  <Td>{fmtDate(inv.due_date)}</Td>
                  <Td><StatusPill status={inv.status} /></Td>
                  <Td className="text-right font-bold">{fmtGBP(invoiceTotal(inv))}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <Link className="btn-ghost" href={`/invoices/${inv.id}`}>
                        <Eye size={14} />
                      </Link>
                      <button className="btn-ghost" onClick={() => { setEditing(inv); setShowForm(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(inv)}>
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
        <InvoiceForm
          initial={editing}
          customers={customers}
          settings={settings}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
