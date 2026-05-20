"use client";

import { Download } from "lucide-react";
import type { Expense, Invoice, Taking, DirectorLoan } from "@/lib/types";
import { TAKINGS_SOURCES, EXPENSE_CATEGORIES } from "@/lib/types";
import { invoiceTotal, todayISO } from "@/lib/utils";

interface Row {
  date: string;
  type: string;
  counterparty: string;
  description: string;
  category: string;
  amount_in: number;
  amount_out: number;
  reference: string;
  id: string;
}

export function ExportAllButton({
  expenses,
  takings,
  invoices,
  loans,
}: {
  expenses: Expense[];
  takings: Taking[];
  invoices: Invoice[];
  loans: DirectorLoan[];
}) {
  function buildRows(): Row[] {
    const rows: Row[] = [];

    for (const e of expenses) {
      const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category);
      rows.push({
        date: e.date,
        type: "Expense",
        counterparty: e.vendor,
        description: e.description ?? "",
        category: cat?.label ?? e.category,
        amount_in: 0,
        amount_out: Number(e.amount),
        reference: e.reference ?? "",
        id: e.id,
      });
    }

    for (const t of takings) {
      const src = TAKINGS_SOURCES.find((s) => s.id === t.source);
      rows.push({
        date: t.date,
        type: "Takings",
        counterparty: src?.label ?? t.source,
        description: [t.event_name, t.description].filter(Boolean).join(" — "),
        category: src?.label ?? "",
        amount_in: Number(t.amount),
        amount_out: 0,
        reference: t.reference ?? "",
        id: t.id,
      });
    }

    for (const inv of invoices) {
      if (inv.status !== "paid") continue;
      rows.push({
        date: inv.date,
        type: "Invoice (paid)",
        counterparty: inv.customer_snapshot?.name ?? "",
        description: (inv.items ?? []).map((it) => it.description).filter(Boolean).join("; "),
        category: "",
        amount_in: invoiceTotal(inv),
        amount_out: 0,
        reference: inv.invoice_number,
        id: inv.id,
      });
    }

    for (const l of loans) {
      const dir = l.direction === "in" ? "in" : "out";
      rows.push({
        date: l.date,
        type: `Director's loan ${dir}`,
        counterparty: "Director (Paul Rudland)",
        description: l.description ?? "",
        category: "",
        amount_in: l.direction === "in" ? Number(l.amount) : 0,
        amount_out: l.direction === "out" ? Number(l.amount) : 0,
        reference: l.reference ?? "",
        id: l.id,
      });
    }

    rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return rows;
  }

  function quote(v: string | number): string {
    return `"${String(v).replace(/"/g, '""')}"`;
  }

  function exportCsv() {
    const rows = buildRows();
    const header = ["Date", "Type", "Counterparty", "Description", "Category / Source", "Amount In", "Amount Out", "Reference", "ID"];
    const lines: string[] = [header.map(quote).join(",")];
    for (const r of rows) {
      lines.push([
        r.date,
        r.type,
        r.counterparty,
        r.description,
        r.category,
        r.amount_in ? r.amount_in.toFixed(2) : "",
        r.amount_out ? r.amount_out.toFixed(2) : "",
        r.reference,
        r.id,
      ].map(quote).join(","));
    }

    // Summary footer
    const totalIn = rows.reduce((s, r) => s + r.amount_in, 0);
    const totalOut = rows.reduce((s, r) => s + r.amount_out, 0);
    lines.push("");
    lines.push(["", "", "", "", "TOTAL", totalIn.toFixed(2), totalOut.toFixed(2), "", ""].map(quote).join(","));
    lines.push(["", "", "", "", "NET", (totalIn - totalOut).toFixed(2), "", "", ""].map(quote).join(","));

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aurora_transactions_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const total = expenses.length + takings.length + invoices.filter((i) => i.status === "paid").length + loans.length;

  return (
    <button className="btn-secondary" onClick={exportCsv} disabled={total === 0} title={total === 0 ? "Nothing to export yet" : `Export ${total} transactions`}>
      <Download size={16} /> Export all ({total})
    </button>
  );
}
