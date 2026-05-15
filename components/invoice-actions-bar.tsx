"use client";

import { useState } from "react";
import { Printer, Edit3, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useToast } from "./toast-provider";
import { setInvoiceStatus } from "@/app/(app)/invoices/actions";
import type { Invoice, InvoiceStatus, Customer, LineItemPreset, Settings } from "@/lib/types";
import { InvoiceForm } from "./invoice-form";
import { fmtGBP, fmtDate, invoiceTotal } from "@/lib/utils";

export function InvoiceActionsBar({
  invoice,
  customers,
  settings,
  presets,
}: {
  invoice: Invoice;
  customers: Customer[];
  settings: Settings;
  presets: LineItemPreset[];
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

  function emailInvoice() {
    const to = invoice.customer_snapshot?.email?.trim();
    if (!to) {
      showToast("No email address on this customer — add one and try again", "error");
      return;
    }
    const company = settings.company_name || "Aurora Events Hire Ltd";
    const subject = `Invoice ${invoice.invoice_number} from ${company}`;
    const lines = [
      `Hi ${invoice.customer_snapshot.name || "there"},`,
      "",
      `Please find attached invoice ${invoice.invoice_number}, dated ${fmtDate(invoice.date)}, for ${fmtGBP(invoiceTotal(invoice))}.`,
      `Payment is due by ${fmtDate(invoice.due_date)}.`,
      "",
      "Bank details:",
      `  Account name: ${settings.bank_name}`,
      `  Sort code: ${settings.bank_sort_code}`,
      `  Account number: ${settings.bank_account}`,
      `  Reference: ${invoice.invoice_number}`,
      "",
      "Thanks,",
      company,
    ];
    const body = lines.join("\n");
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
          <button
            className="btn-secondary"
            onClick={emailInvoice}
            disabled={!invoice.customer_snapshot?.email?.trim()}
            title={invoice.customer_snapshot?.email?.trim() ? `Email ${invoice.customer_snapshot.email}` : "Add an email on this customer first"}
          >
            <Mail size={14} /> Send email
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
          presets={presets}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
