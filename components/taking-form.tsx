"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Taking, TakingSource } from "@/lib/types";
import { TAKINGS_SOURCES } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { saveTaking } from "@/app/(app)/takings/actions";

export function TakingForm({
  initial,
  onClose,
}: {
  initial: Taking | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    date: initial?.date ?? todayISO(),
    source: (initial?.source ?? "cash") as TakingSource,
    amount: initial?.amount?.toString() ?? "",
    event_name: initial?.event_name ?? "",
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
    const res = await saveTaking({
      id: form.id,
      date: form.date,
      source: form.source,
      amount,
      event_name: form.event_name,
      description: form.description,
      reference: form.reference,
    });
    setSaving(false);

    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Takings updated" : "Takings recorded");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit takings" : "Record takings"}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Source" hint="Where the money came in">
            <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as TakingSource })}>
              {TAKINGS_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Amount received (£)" hint="The amount that actually landed (after any SumUp / Square fees)">
          <input
            type="number"
            step="0.01"
            min="0"
            className="input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            autoFocus
          />
        </Field>
        <Field label="Event (optional)" hint="Which event these takings are from">
          <input
            className="input"
            value={form.event_name}
            onChange={(e) => setForm({ ...form, event_name: e.target.value })}
            placeholder="e.g. Stowmarket food festival"
          />
        </Field>
        <Field label="Description (optional)">
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Notes about this takings entry"
          />
        </Field>
        <Field label="Reference (optional)" hint="SumUp / Square payout ID, bank reference, etc.">
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Save takings"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
