"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card, Field, PageHeader } from "./ui";
import { useToast } from "./toast-provider";
import { padNum } from "@/lib/utils";
import type { Settings } from "@/lib/types";
import { updateSettings } from "@/app/(app)/settings/actions";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [form, setForm] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const set = <K extends keyof Settings>(field: K, value: Settings[K]) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateSettings(form);
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else showToast("Settings saved");
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Your company details, invoice defaults, and bank info" />
      <form onSubmit={submit}>
        <Card title="Company details">
          <Field label="Legal company name">
            <input className="input" value={form.company_name} onChange={(e) => set("company_name", e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Company number">
              <input className="input" value={form.company_number} onChange={(e) => set("company_number", e.target.value)} />
            </Field>
            <Field label="VAT number (optional)">
              <input className="input" value={form.vat_number} onChange={(e) => set("vat_number", e.target.value)} placeholder="e.g. GB123456789" />
            </Field>
          </div>
          <Field label="Address">
            <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <Field label="City">
              <input className="input" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Postcode">
              <input className="input" value={form.postcode} onChange={(e) => set("postcode", e.target.value)} />
            </Field>
            <Field label="Country">
              <input className="input" value={form.country} onChange={(e) => set("country", e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Field label="Email">
              <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Website">
              <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </Field>
          </div>
        </Card>

        <Card title="Invoice defaults" className="mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Invoice number prefix">
              <input className="input" value={form.invoice_prefix} onChange={(e) => set("invoice_prefix", e.target.value)} placeholder="INV-" />
            </Field>
            <Field
              label="Next invoice number"
              hint={`Next invoice will be ${form.invoice_prefix}${padNum(form.next_invoice_number)}`}
            >
              <input
                className="input"
                type="number"
                min={1}
                value={form.next_invoice_number}
                onChange={(e) => set("next_invoice_number", parseInt(e.target.value) || 1)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Field label="Default VAT">
              <label className="flex items-center gap-2 px-3.5 py-2.5 border bg-white rounded-[10px] cursor-pointer" style={{ borderWidth: "1.5px", borderColor: "var(--brand-line)" }}>
                <input type="checkbox" checked={form.vat_enabled} onChange={(e) => set("vat_enabled", e.target.checked)} />
                Apply VAT by default
              </label>
            </Field>
            <Field label="VAT rate (%)">
              <input className="input" type="number" step="0.1" value={form.vat_rate} onChange={(e) => set("vat_rate", parseFloat(e.target.value) || 0)} />
            </Field>
          </div>
          <Field label="Default payment terms" hint="Will be pre-filled when creating new invoices">
            <textarea
              className="input resize-y font-sans"
              rows={3}
              value={form.payment_terms}
              onChange={(e) => set("payment_terms", e.target.value)}
            />
          </Field>
        </Card>

        <Card title="Bank details for invoices" className="mt-5">
          <p className="text-sm text-brand-ink-soft -mt-1 mb-3.5">
            These will appear on every invoice. Leave blank to omit.
          </p>
          <Field label="Bank name">
            <input className="input" value={form.bank_name} onChange={(e) => set("bank_name", e.target.value)} placeholder="e.g. Barclays" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Field label="Sort code">
              <input className="input" value={form.bank_sort_code} onChange={(e) => set("bank_sort_code", e.target.value)} placeholder="20-00-00" />
            </Field>
            <Field label="Account number">
              <div className="sm:col-span-2">
                <input className="input" value={form.bank_account} onChange={(e) => set("bank_account", e.target.value)} placeholder="12345678" />
              </div>
            </Field>
          </div>
        </Card>

        <div className="flex justify-end mt-6">
          <button type="submit" disabled={saving} className="btn-primary">
            <Check size={16} /> {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
