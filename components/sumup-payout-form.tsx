"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import { todayISO, fmtGBP } from "@/lib/utils";
import { recordSumupPayout } from "@/app/(app)/takings/actions";

interface EventRow {
  date: string;
  event_name: string;
  gross_amount: string;
}

function blankRow(date: string): EventRow {
  return { date, event_name: "", gross_amount: "" };
}

export function SumupPayoutForm({ onClose }: { onClose: () => void }) {
  const today = todayISO();
  const [payoutDate, setPayoutDate] = useState(today);
  const [reference, setReference] = useState("");
  const [fees, setFees] = useState("");
  const [feesNote, setFeesNote] = useState("");
  const [events, setEvents] = useState<EventRow[]>([blankRow(today), blankRow(today)]);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const grossTotal = useMemo(
    () => events.reduce((s, e) => s + (parseFloat(e.gross_amount) || 0), 0),
    [events]
  );
  const feesNum = parseFloat(fees) || 0;
  const netToBank = grossTotal - feesNum;

  function updateEvent(idx: number, field: keyof EventRow, value: string) {
    setEvents((es) => es.map((e, i) => (i === idx ? { ...e, [field]: value } : e)));
  }
  function addEvent() {
    setEvents((es) => [...es, blankRow(payoutDate)]);
  }
  function removeEvent(idx: number) {
    setEvents((es) => es.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return showToast("Payout reference required", "error");
    const validEvents = events
      .filter((ev) => ev.event_name.trim() && parseFloat(ev.gross_amount) > 0)
      .map((ev) => ({
        date: ev.date,
        event_name: ev.event_name.trim(),
        gross_amount: parseFloat(ev.gross_amount),
      }));
    if (validEvents.length === 0) return showToast("Add at least one event with a name and amount", "error");

    setSaving(true);
    const res = await recordSumupPayout({
      payout_date: payoutDate,
      payout_reference: reference,
      fees: feesNum,
      fees_note: feesNote,
      events: validEvents,
    });
    setSaving(false);

    if (res.error) showToast(res.error, "error");
    else {
      showToast(`Recorded ${validEvents.length} event takings + ${feesNum > 0 ? "fee expense" : "no fees"}`);
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title="Record SumUp payout" wide>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Payout date" hint="The date the money landed in your bank">
            <input type="date" className="input" value={payoutDate} onChange={(e) => setPayoutDate(e.target.value)} required />
          </Field>
          <Field label="Payout reference" hint="From the SumUp payout report, e.g. MR9 PID1239572">
            <input className="input" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="MR9 PID…" required />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="SumUp fees deducted (£)" hint="Total fees taken before the payout hit your bank">
            <input type="number" step="0.01" min="0" className="input" value={fees} onChange={(e) => setFees(e.target.value)} />
          </Field>
          <Field label="Fees note (optional)" hint='e.g. "Mastercard £8.80, Visa £9.41"'>
            <input className="input" value={feesNote} onChange={(e) => setFeesNote(e.target.value)} placeholder="Card scheme breakdown" />
          </Field>
        </div>

        <h3 className="text-sm font-bold mt-4 mb-2.5 text-brand-blue">Events in this payout</h3>
        <div className="border border-brand-line rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-[140px_1fr_140px_40px] gap-2 px-3 py-2.5 bg-brand-cream text-xs font-bold text-brand-ink-soft uppercase tracking-wide">
            <div>Date</div>
            <div>Event name</div>
            <div className="text-right">Gross £</div>
            <div></div>
          </div>
          {events.map((ev, idx) => (
            <div key={idx} className="grid grid-cols-[140px_1fr_140px_40px] gap-2 p-2.5 border-t border-brand-line items-center">
              <input type="date" className="input" value={ev.date} onChange={(e) => updateEvent(idx, "date", e.target.value)} />
              <input className="input" placeholder="e.g. Flint Hall Wedding" value={ev.event_name} onChange={(e) => updateEvent(idx, "event_name", e.target.value)} />
              <input type="number" step="0.01" min="0" className="input text-right" value={ev.gross_amount} onChange={(e) => updateEvent(idx, "gross_amount", e.target.value)} />
              <button type="button" className="btn-danger" onClick={() => removeEvent(idx)} disabled={events.length === 1}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="p-2.5 border-t border-brand-line">
            <button type="button" className="btn-ghost" onClick={addEvent}>
              <Plus size={14} /> Add another event
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-brand-cream rounded-xl space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-brand-ink-soft">Gross takings (sum of events)</span>
            <span className="font-semibold">{fmtGBP(grossTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-brand-ink-soft">SumUp fees</span>
            <span className="font-semibold text-brand-orange">−{fmtGBP(feesNum)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-brand-line items-center">
            <span className="heading-display text-base text-brand-blue">Net to bank</span>
            <span className="heading-display text-xl text-brand-orange">{fmtGBP(netToBank)}</span>
          </div>
          <div className="text-xs text-brand-ink-soft mt-1">
            This figure should match the single line on your bank statement for this payout.
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save payout"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
