"use client";

import { useState } from "react";
import { Printer, Edit3, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "./toast-provider";
import { setInvoiceStatus } from "@/app/(app)/invoices/actions";
import type { Invoice, InvoiceStatus, Customer, Settings } from "@/lib/types";
import { InvoiceForm } from "./invoice-form";

export function InvoiceActionsBar({
  invoice,
  customers,
  settings,
}: {
  invoice: Invoice;
  customers: Customer[];
  settings: Settings;
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [showEdit, setShowEdit] = useState(false);

  async function onStatusChange(s: InvoiceStatus) {
    setStatus(s);
    const res = await setInvoiceStatus(invoice.id, s);
    if (res.error) showToast(res.error, "error");
    else showToast(`Marked as ${s}`);
  }

  return (
    <>
      <div className="no-print flex justify-between items-center mb-5 flex-wrap gap-3 max-w-[210mm] mx-auto px-4">
        <Link href="/invoices" className="btn-ghost">
          <ArrowLeft size={16} /> Back to invoices
        </Link>
        <div className="flex gap-3 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-brand-ink-soft">Status:</span>
            <select className="input py-1.5" value={status} onChange={(e) => onStatusChange(e.target.value as InvoiceStatus)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            <Edit3 size={14} /> Edit
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {showEdit && (
        <InvoiceForm
          initial={invoice}
          customers={customers}
          settings={settings}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
