"use client";

import { useState } from "react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { LineItemPreset } from "@/lib/types";
import { savePreset } from "@/app/(app)/catalogue/actions";

export function PresetForm({
  initial,
  onClose,
}: {
  initial: LineItemPreset | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    description: initial?.description ?? "",
    default_qty: initial ? String(initial.default_qty) : "1",
    default_price: initial ? String(initial.default_price) : "",
    sort_order: initial ? String(initial.sort_order) : "0",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim()) {
      showToast("Description is required", "error");
      return;
    }
    setSaving(true);
    const res = await savePreset({
      id: form.id,
      description: form.description,
      default_qty: parseFloat(form.default_qty) || 0,
      default_price: parseFloat(form.default_price) || 0,
      sort_order: parseInt(form.sort_order) || 0,
    });
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Catalogue item updated" : "Catalogue item added");
      onClose();
    }
  }

  return (
    <Modal onClose={onClose} title={initial ? "Edit catalogue item" : "Add catalogue item"}>
      <form onSubmit={submit}>
        <Field label="Description" hint="What appears on the invoice line when picked">
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Hog Roast"
            required
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Default qty">
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.default_qty}
              onChange={(e) => setForm({ ...form, default_qty: e.target.value })}
            />
          </Field>
          <Field label="Default unit price (£)" hint="Use 0 if it varies — you can still set it on the invoice">
            <input
              className="input"
              type="number"
              step="0.01"
              min="0"
              value={form.default_price}
              onChange={(e) => setForm({ ...form, default_price: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Sort order" hint="Lower numbers appear first in the catalogue dropdown">
          <input
            className="input"
            type="number"
            step="1"
            value={form.sort_order}
            onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
