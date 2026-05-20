"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { PotKind } from "@/lib/types";
import { todayISO, fmtGBP } from "@/lib/utils";
import { savePotAllocation } from "@/app/(app)/pots/actions";

export function PotAllocateModal({
  pot,
  potLabel,
  suggested,
  onClose,
}: {
  pot: PotKind;
  potLabel: string;
  suggested: number;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    date: todayISO(),
    amount: suggested > 0 ? suggested.toFixed(2) : "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return showToast("Amount must be > 0", "error");
    setSaving(true);
    const res = await savePotAllocation({
      pot,
      date: form.date,
      amount,
      note: form.note,
    });
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(`${fmtGBP(amount)} marked as moved to ${potLabel}`);
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={`Move to ${potLabel}`}>
      <form onSubmit={submit}>
        <p className="text-sm text-brand-ink-soft mb-4">
          Confirm how much you&apos;ve moved from your Monzo current account into the {potLabel} pot.
          Suggested amount is the current outstanding (calculated obligation minus what&apos;s already been allocated).
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Date moved">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Amount moved (£)">
            <input type="number" step="0.01" min="0" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required autoFocus />
          </Field>
        </div>
        <Field label="Note (optional)">
          <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="e.g. May tax setaside" />
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Record allocation"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
