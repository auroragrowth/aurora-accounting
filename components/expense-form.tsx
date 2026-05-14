"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Expense, ExpenseCategory, Payee } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { todayISO } from "@/lib/utils";
import { processReceiptFile } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { saveExpense } from "@/app/(app)/expenses/actions";

export function ExpenseForm({
  initial,
  payees,
  onClose,
}: {
  initial: Expense | null;
  payees: Payee[];
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    date: initial?.date ?? todayISO(),
    category: (initial?.category ?? "suppliers") as ExpenseCategory,
    vendor: initial?.vendor ?? "",
    description: initial?.description ?? "",
    amount: initial?.amount?.toString() ?? "",
    payment_method: initial?.payment_method ?? "",
    reference: initial?.reference ?? "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptName, setReceiptName] = useState(initial?.receipt_name ?? "");
  const [removeReceipt, setRemoveReceipt] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  function handleVendorChange(value: string) {
    const matched = payees.find((p) => p.name.toLowerCase() === value.toLowerCase());
    if (matched && !initial) {
      setForm((f) => ({ ...f, vendor: value, category: matched.category }));
    } else {
      setForm((f) => ({ ...f, vendor: value }));
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large (max 10MB)", "error");
      return;
    }
    setReceiptFile(file);
    setReceiptName(file.name);
    setRemoveReceipt(false);
  }

  function clearReceipt() {
    setReceiptFile(null);
    setReceiptName("");
    setRemoveReceipt(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.vendor.trim()) return showToast("Vendor / payee required", "error");
    const amount = parseFloat(form.amount);
    if (!amount || amount <= 0) return showToast("Valid amount required", "error");

    setSaving(true);

    let receiptPath: string | null | undefined = undefined;
    let receiptType: string | null | undefined = undefined;
    let receiptName_: string | null | undefined = undefined;

    if (receiptFile) {
      try {
        const processed = await processReceiptFile(receiptFile);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not signed in");

        const ext = processed.type === "pdf" ? "pdf" : "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("receipts").upload(path, processed.data, {
          contentType: processed.contentType,
          upsert: false,
        });
        if (upErr) {
          setSaving(false);
          return showToast("Receipt upload failed: " + upErr.message, "error");
        }
        receiptPath = path;
        receiptType = processed.type;
        receiptName_ = processed.name;
      } catch (err) {
        setSaving(false);
        return showToast("Could not process receipt: " + (err as Error).message, "error");
      }
    }

    const res = await saveExpense({
      id: form.id,
      date: form.date,
      category: form.category,
      vendor: form.vendor,
      description: form.description,
      amount,
      payment_method: form.payment_method,
      reference: form.reference,
      receipt_path: receiptPath,
      receipt_type: receiptType,
      receipt_name: receiptName_,
      remove_receipt: removeReceipt && !receiptFile,
    });

    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Expense updated" : "Expense added");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit expense" : "Log new expense"}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field
          label="Vendor / Payee"
          hint={payees.length > 0 ? "Start typing to pick from your saved payees, or add a new one" : "Who you paid (e.g. supplier name, staff member)"}
        >
          <input
            className="input"
            list="payees-datalist"
            value={form.vendor}
            onChange={(e) => handleVendorChange(e.target.value)}
            required
          />
          <datalist id="payees-datalist">
            {payees.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
        </Field>
        <Field label="Description (optional)">
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What was this for?"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Amount (£)">
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </Field>
          <Field label="Payment method (optional)">
            <select className="input" value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
              <option value="">—</option>
              <option value="bank">Bank transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="direct-debit">Direct debit</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>
        <Field label="Reference (optional)" hint="Invoice number from supplier, etc.">
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </Field>
        <Field label="Receipt (optional)" hint="Image (JPG/PNG/HEIC) or PDF, max 10MB. Images get compressed automatically.">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex flex-wrap gap-2 items-center">
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> {receiptName ? "Change file" : "Upload receipt"}
            </button>
            {receiptName && (
              <div className="text-sm text-brand-ink-soft flex items-center gap-2">
                {receiptName}
                <button type="button" className="btn-ghost px-1" onClick={clearReceipt}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Save expense"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
