"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, Eye, Download } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { ExpenseForm } from "./expense-form";
import { ReceiptViewer } from "./receipt-viewer";
import { useToast } from "./toast-provider";
import { fmtGBP, fmtDate, todayISO } from "@/lib/utils";
import type { Expense, Payee } from "@/lib/types";
import { EXPENSE_CATEGORIES, expenseCategoryLabel } from "@/lib/types";
import { deleteExpense } from "@/app/(app)/expenses/actions";

export function ExpensesView({
  expenses,
  payees,
}: {
  expenses: Expense[];
  payees: Payee[];
}) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      expenses.filter((e) => {
        if (filterCat !== "all" && e.category !== filterCat) return false;
        if (search && !`${e.vendor} ${e.description ?? ""} ${e.reference ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [expenses, filterCat, search]
  );

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0);

  async function handleDelete(e: Expense) {
    if (!confirm("Delete this expense? This also removes any uploaded receipt.")) return;
    const res = await deleteExpense(e.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Expense deleted");
  }

  function exportCSV() {
    const rows: string[][] = [["Date", "Category", "Vendor", "Description", "Amount", "Payment Method", "Reference"]];
    filtered.forEach((e) => {
      rows.push([
        e.date,
        expenseCategoryLabel(e.category),
        e.vendor,
        e.description ?? "",
        Number(e.amount).toFixed(2),
        e.payment_method ?? "",
        e.reference ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`${filtered.length} entries · ${fmtGBP(total)} total`}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={16} /> New expense
            </button>
          </div>
        }
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
          <input
            className="input pl-10"
            placeholder="Search vendor, description, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            text={expenses.length === 0 ? "No expenses logged yet. Add your first one to get started." : "No expenses match your filters."}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Vendor / Payee</Th>
                <Th>Description</Th>
                <Th className="text-right">Amount</Th>
                <Th>Receipt</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const cat = EXPENSE_CATEGORIES.find((c) => c.id === e.category);
                return (
                  <tr key={e.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                    <Td>{fmtDate(e.date)}</Td>
                    <Td>
                      {cat && (
                        <span className="pill" style={{ background: `${cat.color}15`, color: cat.color }}>
                          {cat.label}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <strong>{e.vendor}</strong>
                      {e.reference && <div className="text-[11px] text-brand-ink-soft mt-0.5">Ref: {e.reference}</div>}
                    </Td>
                    <Td className="text-brand-ink-soft">{e.description}</Td>
                    <Td className="text-right font-bold">{fmtGBP(e.amount)}</Td>
                    <Td>
                      {e.receipt_path ? (
                        <button className="btn-ghost" onClick={() => setViewing(e)}>
                          <Eye size={14} /> View
                        </button>
                      ) : (
                        <span className="text-brand-ink-soft text-xs">—</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-ghost" onClick={() => { setEditing(e); setShowForm(true); }}>
                          <Edit3 size={14} />
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(e)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <ExpenseForm
          initial={editing}
          payees={payees}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      {viewing && (
        <ReceiptViewer expense={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}
