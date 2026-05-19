"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { DirectorLoan, LoanDirection } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { saveDirectorLoan } from "@/app/(app)/directors-loan/actions";

export function DirectorLoanForm({
  initial,
  defaultDirection,
  onClose,
}: {
  initial: DirectorLoan | null;
  defaultDirection?: LoanDirection;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    date: initial?.date ?? todayISO(),
    direction: (initial?.direction ?? defaultDirection ?? "in") as LoanDirection,
    amount: initial?.amount?.toString() ?? "",
    description: initial?.description ?? "",
    reference: initial?.reference ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return showToast("Valid amount required", "error");
    setSaving(true);
    const res = await saveDirectorLoan({
      id: form.id,
      date: form.date,
      direction: form.direction,
      amount,
      description: form.description,
      reference: form.reference,
    });
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Entry updated" : "Loan entry recorded");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit director's loan entry" : "Record director's loan entry"}>
      <form onSubmit={submit}>
        <Field label="Direction" hint="In = director puts money into the company. Out = company repays director.">
          <select className="input" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as LoanDirection })}>
            <option value="in">In — director → company</option>
            <option value="out">Out — company → director</option>
          </select>
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Amount (£)">
            <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required autoFocus />
          </Field>
        </div>
        <Field label="Description (optional)">
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Cover Booker order, payback after September event" />
        </Field>
        <Field label="Reference (optional)" hint="Bank reference or transaction ID">
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Save entry"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
