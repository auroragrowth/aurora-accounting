"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Payee, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { savePayee } from "@/app/(app)/contacts/actions";

export function PayeeForm({
  initial,
  onClose,
}: {
  initial: Payee | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    category: (initial?.category ?? "suppliers") as ExpenseCategory,
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Payee name is required", "error");
      return;
    }
    setSaving(true);
    const res = await savePayee(form);
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Payee updated" : "Payee added");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit payee" : "Add payee / supplier"}>
      <form onSubmit={submit}>
        <Field label="Name" hint="Staff member, supplier, contractor, etc.">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Default category" hint="Used to pre-fill the category when you log expenses to this payee">
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Notes (optional)">
          <textarea
            className="input resize-y font-sans"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Add payee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
