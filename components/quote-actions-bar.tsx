"use client";

import { useState } from "react";
import { Printer, Edit3, ArrowLeft, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "./toast-provider";
import { setQuoteStatus, convertQuoteToInvoice } from "@/app/(app)/quotes/actions";
import type { Quote, QuoteStatus, Customer, LineItemPreset, Settings } from "@/lib/types";
import { QuoteForm } from "./quote-form";
import { fmtGBP, fmtDate, invoiceTotal } from "@/lib/utils";

export function QuoteActionsBar({
  quote,
  customers,
  settings,
  presets,
}: {
  quote: Quote;
  customers: Customer[];
  settings: Settings;
  presets: LineItemPreset[];
}) {
  const { showToast } = useToast();
  const router = useRouter();
  const [status, setStatus] = useState<QuoteStatus>(quote.status);
  const [showEdit, setShowEdit] = useState(false);
  const [converting, setConverting] = useState(false);

  async function onStatusChange(s: QuoteStatus) {
    setStatus(s);
    const res = await setQuoteStatus(quote.id, s);
    if (res.error) showToast(res.error, "error");
    else showToast(`Marked as ${s}`);
  }

  function emailQuote() {
    const to = quote.customer_snapshot?.email?.trim();
    if (!to) {
      showToast("No email address on this customer — add one and try again", "error");
      return;
    }
    const company = settings.company_name || "Aurora Events Hire Ltd";
    const subject = `Quote ${quote.quote_number} from ${company}`;
    const lines = [
      `Hi ${quote.customer_snapshot.name || "there"},`,
      "",
      `Please find attached quote ${quote.quote_number}, dated ${fmtDate(quote.date)}, for ${fmtGBP(invoiceTotal(quote))}.`,
      `This quote is valid until ${fmtDate(quote.valid_until)}.`,
      "",
      "Let me know if you'd like to go ahead and I'll get the booking confirmed.",
      "",
      "Thanks,",
      company,
    ];
    const body = lines.join("\n");
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function handleConvert() {
    if (quote.converted_invoice_id) {
      router.push(`/invoices/${quote.converted_invoice_id}`);
      return;
    }
    if (!confirm(`Convert quote ${quote.quote_number} to a new invoice? This marks the quote as accepted.`)) return;
    setConverting(true);
    const res = await convertQuoteToInvoice(quote.id);
    setConverting(false);
    if (res.error) {
      showToast(res.error, "error");
      return;
    }
    if (res.invoiceId) {
      showToast(`Invoice ${res.invoiceNumber ?? ""} created`.trim());
      router.push(`/invoices/${res.invoiceId}`);
    }
  }

  const convertLabel = quote.converted_invoice_id ? "View invoice" : "Convert to invoice";

  return (
    <>
      <div className="no-print flex justify-between items-center mb-5 flex-wrap gap-3 max-w-[210mm] mx-auto px-4">
        <Link href="/quotes" className="btn-ghost">
          <ArrowLeft size={16} /> Back to quotes
        </Link>
        <div className="flex gap-3 items-center flex-wrap">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-brand-ink-soft">Status:</span>
            <select className="input py-1.5" value={status} onChange={(e) => onStatusChange(e.target.value as QuoteStatus)}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
              <option value="expired">Expired</option>
            </select>
          </label>
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            <Edit3 size={14} /> Edit
          </button>
          <button
            className="btn-secondary"
            onClick={emailQuote}
            disabled={!quote.customer_snapshot?.email?.trim()}
            title={quote.customer_snapshot?.email?.trim() ? `Email ${quote.customer_snapshot.email}` : "Add an email on this customer first"}
          >
            <Mail size={14} /> Send email
          </button>
          <button
            className="btn-secondary"
            onClick={handleConvert}
            disabled={converting}
            title={quote.converted_invoice_id ? "Open the invoice created from this quote" : "Create a draft invoice from this quote"}
          >
            <FileText size={14} /> {converting ? "Converting…" : convertLabel}
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {showEdit && (
        <QuoteForm
          initial={quote}
          customers={customers}
          settings={settings}
          presets={presets}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
