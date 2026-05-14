"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { Customer, Invoice, InvoiceItem, InvoiceStatus, Settings } from "@/lib/types";
import { fmtGBP, todayISO } from "@/lib/utils";
import { saveInvoice } from "@/app/(app)/invoices/actions";

const emptyCustomer = {
  name: "",
  email: "",
  address: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
};

export function InvoiceForm({
  initial,
  customers,
  settings,
  onClose,
}: {
  initial: Invoice | null;
  customers: Customer[];
  settings: Settings;
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    id: initial?.id,
    date: initial?.date ?? todayISO(),
    due_date: initial?.due_date ?? todayISO(),
    customer_id: initial?.customer_id ?? null,
    customer: initial?.customer_snapshot ?? { ...emptyCustomer },
    items: initial?.items?.length
      ? initial.items.map((it) => ({ description: it.description, qty: String(it.qty), price: String(it.price) }))
      : [{ description: "", qty: "1", price: "" }],
    notes: initial?.notes ?? "",
    payment_terms: initial?.payment_terms ?? settings.payment_terms,
    vat_enabled: initial?.vat_enabled ?? settings.vat_enabled,
    vat_rate: initial ? Number(initial.vat_rate) : Number(settings.vat_rate),
    status: (initial?.status ?? "draft") as InvoiceStatus,
  });

  const { subtotal, vat, total } = useMemo(() => {
    const sub = form.items.reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
    const vatVal = form.vat_enabled ? sub * (form.vat_rate / 100) : 0;
    return { subtotal: sub, vat: vatVal, total: sub + vatVal };
  }, [form.items, form.vat_enabled, form.vat_rate]);

  function pickCustomer(id: string) {
    const c = customers.find((x) => x.id === id);
    if (!c) return;
    setForm({
      ...form,
      customer_id: c.id,
      customer: {
        name: c.name,
        email: c.email ?? "",
        address: c.address ?? "",
        city: c.city ?? "",
        postcode: c.postcode ?? "",
        country: c.country ?? "United Kingdom",
      },
    });
  }

  function updateItem(idx: number, field: keyof typeof form.items[number], value: string) {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { description: "", qty: "1", price: "" }] }));
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customer.name.trim()) return showToast("Customer name is required", "error");
    const items: InvoiceItem[] = form.items
      .filter((it) => it.description.trim() && it.price !== "")
      .map((it) => ({
        description: it.description,
        qty: parseFloat(it.qty) || 0,
        price: parseFloat(it.price) || 0,
      }));
    if (items.length === 0) return showToast("Add at least one line item with a description and price", "error");

    setSaving(true);
    const res = await saveInvoice({
      id: form.id,
      date: form.date,
      due_date: form.due_date,
      customer_id: form.customer_id,
      customer_snapshot: form.customer,
      items,
      notes: form.notes,
      payment_terms: form.payment_terms,
      vat_enabled: form.vat_enabled,
      vat_rate: form.vat_rate,
      status: form.status,
    });
    setSaving(false);

    if (res.error) showToast(res.error, "error");
    else {
      showToast(form.id ? "Invoice updated" : `Invoice ${res.invoice_number} created`);
      onClose();
      if (res.id && !form.id) router.push(`/invoices/${res.id}`);
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? `Edit ${initial.invoice_number}` : "New invoice"} wide>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Invoice date">
            <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </Field>
          <Field label="Due date">
            <input type="date" className="input" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
          </Field>
        </div>

        <h3 className="text-sm font-bold mt-4 mb-2.5 text-brand-blue">Customer</h3>

        {customers.length > 0 && !initial && (
          <Field label="Pick a saved customer" hint="Or just type a new name below to start fresh">
            <select
              className="input"
              value={form.customer_id ?? ""}
              onChange={(e) => e.target.value && pickCustomer(e.target.value)}
            >
              <option value="">— Select existing customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.city ? ` (${c.city})` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Customer name">
          <input
            className="input"
            list="customers-datalist"
            value={form.customer.name}
            onChange={(e) => {
              const name = e.target.value;
              const matched = customers.find((c) => c.name.toLowerCase() === name.toLowerCase());
              if (matched) {
                pickCustomer(matched.id);
              } else {
                setForm({ ...form, customer: { ...form.customer, name }, customer_id: null });
              }
            }}
            required
          />
          <datalist id="customers-datalist">
            {customers.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Email (optional)">
            <input type="email" className="input" value={form.customer.email} onChange={(e) => setForm({ ...form, customer: { ...form.customer, email: e.target.value } })} />
          </Field>
          <Field label="Country">
            <input className="input" value={form.customer.country} onChange={(e) => setForm({ ...form, customer: { ...form.customer, country: e.target.value } })} />
          </Field>
        </div>

        <Field label="Address (optional)">
          <input className="input" value={form.customer.address} onChange={(e) => setForm({ ...form, customer: { ...form.customer, address: e.target.value } })} />
        </Field>

        <div className="grid grid-cols-2 gap-3.5">
          <Field label="City">
            <input className="input" value={form.customer.city} onChange={(e) => setForm({ ...form, customer: { ...form.customer, city: e.target.value } })} />
          </Field>
          <Field label="Postcode">
            <input className="input" value={form.customer.postcode} onChange={(e) => setForm({ ...form, customer: { ...form.customer, postcode: e.target.value } })} />
          </Field>
        </div>

        <h3 className="text-sm font-bold mt-4 mb-2.5 text-brand-blue">Line items</h3>

        <div className="border border-brand-line rounded-[10px] overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_110px_40px] gap-2 px-3 py-2.5 bg-brand-cream text-xs font-bold text-brand-ink-soft uppercase tracking-wide">
            <div>Description</div>
            <div>Qty</div>
            <div>Unit £</div>
            <div></div>
          </div>
          {form.items.map((it, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_70px_110px_40px] gap-2 p-2.5 border-t border-brand-line items-center">
              <input
                className="input"
                placeholder="e.g. Mobile bar hire – wedding 15/06"
                value={it.description}
                onChange={(e) => updateItem(idx, "description", e.target.value)}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={it.qty}
                onChange={(e) => updateItem(idx, "qty", e.target.value)}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                min="0"
                value={it.price}
                onChange={(e) => updateItem(idx, "price", e.target.value)}
              />
              <button type="button" className="btn-danger" onClick={() => removeItem(idx)}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <div className="p-2.5 border-t border-brand-line">
            <button type="button" className="btn-ghost" onClick={addItem}>
              <Plus size={14} /> Add line
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-brand-cream rounded-xl">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-brand-ink-soft">Subtotal</span>
            <span className="font-semibold">{fmtGBP(subtotal)}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-brand-ink-soft">
              <input
                type="checkbox"
                checked={form.vat_enabled}
                onChange={(e) => setForm({ ...form, vat_enabled: e.target.checked })}
              />
              Apply VAT
              {form.vat_enabled && (
                <span className="inline-flex items-center gap-1">
                  @ <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.vat_rate}
                    onChange={(e) => setForm({ ...form, vat_rate: parseFloat(e.target.value) || 0 })}
                    className="w-14 px-2 py-1 border border-brand-line rounded text-sm"
                  /> %
                </span>
              )}
            </label>
            <span className="font-semibold">{fmtGBP(vat)}</span>
          </div>
          <div className="flex justify-between pt-2.5 border-t border-brand-line items-center">
            <span className="heading-display text-base text-brand-blue">TOTAL</span>
            <span className="heading-display text-xl text-brand-orange">{fmtGBP(total)}</span>
          </div>
        </div>

        <Field label="Notes (optional)" hint="Visible on the invoice">
          <textarea
            className="input resize-y font-sans"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Thank you for your business, looking forward to the event!"
          />
        </Field>

        <Field label="Payment terms (optional)">
          <textarea
            className="input resize-y font-sans"
            rows={2}
            value={form.payment_terms}
            onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
          />
        </Field>

        {initial && (
          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </Field>
        )}

        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Create invoice"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
