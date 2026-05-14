"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Customer } from "@/lib/types";
import { saveCustomer } from "@/app/(app)/contacts/actions";

export function CustomerForm({
  initial,
  onClose,
}: {
  initial: Customer | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    address: initial?.address ?? "",
    city: initial?.city ?? "",
    postcode: initial?.postcode ?? "",
    country: initial?.country ?? "United Kingdom",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast("Customer name is required", "error");
      return;
    }
    setSaving(true);
    const res = await saveCustomer(form);
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Customer updated" : "Customer added");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit customer" : "Add customer"}>
      <form onSubmit={submit}>
        <Field label="Customer name">
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Email (optional)">
          <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Address (optional)">
          <input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="City">
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Postcode">
            <input className="input" value={form.postcode} onChange={(e) => setForm({ ...form, postcode: e.target.value })} />
          </Field>
        </div>
        <Field label="Country">
          <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
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
            {saving ? "Saving…" : initial ? "Save changes" : "Add customer"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
