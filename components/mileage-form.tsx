"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Mileage } from "@/lib/types";
import { todayISO, fmtGBP } from "@/lib/utils";
import { saveMileage } from "@/app/(app)/mileage/actions";

export function MileageForm({
  initial,
  defaultRate,
  knownEvents,
  onClose,
}: {
  initial: Mileage | null;
  defaultRate: number;
  knownEvents: string[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    date: initial?.date ?? todayISO(),
    from_place: initial?.from_place ?? "",
    to_place: initial?.to_place ?? "",
    miles: initial?.miles?.toString() ?? "",
    purpose: initial?.purpose ?? "",
    event_name: initial?.event_name ?? "",
    rate_used: (initial?.rate_used ?? defaultRate).toString(),
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const miles = parseFloat(form.miles) || 0;
  const rate = parseFloat(form.rate_used) || 0;
  const claim = miles * rate;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.from_place.trim() || !form.to_place.trim()) return showToast("From and to required", "error");
    if (!miles || miles <= 0) return showToast("Miles must be > 0", "error");
    setSaving(true);
    const res = await saveMileage({
      id: form.id,
      date: form.date,
      from_place: form.from_place,
      to_place: form.to_place,
      miles,
      purpose: form.purpose,
      event_name: form.event_name,
      rate_used: rate,
    });
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Trip updated" : "Trip logged");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit trip" : "Log a trip"}>
      <form onSubmit={submit}>
        <Field label="Date">
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="From">
            <input className="input" value={form.from_place} onChange={(e) => setForm({ ...form, from_place: e.target.value })} placeholder="e.g. Stowmarket" required />
          </Field>
          <Field label="To">
            <input className="input" value={form.to_place} onChange={(e) => setForm({ ...form, to_place: e.target.value })} placeholder="e.g. Flint Hall, Ipswich" required />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Miles">
            <input type="number" step="0.1" min="0" className="input" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} required autoFocus />
          </Field>
          <Field label="Rate (£/mile)" hint="HMRC: 45p first 10k miles, 25p after">
            <input type="number" step="0.001" min="0" className="input" value={form.rate_used} onChange={(e) => setForm({ ...form, rate_used: e.target.value })} required />
          </Field>
        </div>
        <Field label="Purpose (optional)">
          <input className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="e.g. Picking up bar equipment, site visit" />
        </Field>
        <Field label="Event (optional)" hint="Tag to an event so it shows up in per-event profitability">
          <input
            className="input"
            list="mileage-events"
            value={form.event_name}
            onChange={(e) => setForm({ ...form, event_name: e.target.value })}
            placeholder="e.g. Flint Hall Wedding"
          />
          <datalist id="mileage-events">
            {knownEvents.map((ev) => <option key={ev} value={ev} />)}
          </datalist>
        </Field>
        <div className="mt-4 p-4 bg-brand-cream rounded-xl flex justify-between items-center">
          <span className="text-sm text-brand-ink-soft">Mileage claim</span>
          <span className="heading-display text-xl text-brand-orange">{fmtGBP(claim)}</span>
        </div>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Log trip"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
