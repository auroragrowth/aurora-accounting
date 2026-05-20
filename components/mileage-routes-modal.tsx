"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, MapPin } from "lucide-react";
import { Field, Modal } from "./ui";
import { useToast } from "./toast-provider";
import type { MileageRoute } from "@/lib/types";
import { saveMileageRoute, deleteMileageRoute } from "@/app/(app)/mileage/actions";

export function MileageRoutesModal({
  routes,
  onClose,
}: {
  routes: MileageRoute[];
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<MileageRoute | null>(null);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  if (editing || adding) {
    return (
      <RouteForm
        initial={editing}
        onClose={() => { setEditing(null); setAdding(false); }}
        onCloseAll={onClose}
      />
    );
  }

  async function handleDelete(r: MileageRoute) {
    if (!confirm(`Delete "${labelFor(r)}"?`)) return;
    const res = await deleteMileageRoute(r.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Route deleted");
  }

  return (
    <Modal onClose={onClose} title="Saved routes" wide>
      <div className="flex justify-end mb-3">
        <button className="btn-primary" onClick={() => setAdding(true)}>
          <Plus size={14} /> Add route
        </button>
      </div>
      {routes.length === 0 ? (
        <div className="py-10 text-center text-sm text-brand-ink-soft">
          No saved routes yet. Add your first one — common trips like Home → Flint Hall make logging mileage one-click.
        </div>
      ) : (
        <div className="border border-brand-line rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <th className="px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-brand-ink-soft tracking-wide">Route</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-brand-ink-soft tracking-wide">Miles</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r) => (
                <tr key={r.id} className="border-b border-brand-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{labelFor(r)}</td>
                  <td className="px-4 py-3 text-brand-ink-soft">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={12} /> {r.from_place} → {r.to_place}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{Number(r.miles).toFixed(1)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button className="btn-ghost" onClick={() => setEditing(r)}><Edit3 size={14} /></button>
                      <button className="btn-danger" onClick={() => handleDelete(r)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex justify-end mt-5 pt-4 border-t border-brand-line">
        <button className="btn-ghost" onClick={onClose}>Done</button>
      </div>
    </Modal>
  );
}

function labelFor(r: MileageRoute): string {
  return r.name?.trim() || `${r.from_place} → ${r.to_place}`;
}

function RouteForm({
  initial,
  onClose,
  onCloseAll,
}: {
  initial: MileageRoute | null;
  onClose: () => void;
  onCloseAll: () => void;
}) {
  const [form, setForm] = useState({
    id: initial?.id,
    name: initial?.name ?? "",
    from_place: initial?.from_place ?? "",
    to_place: initial?.to_place ?? "",
    miles: initial?.miles?.toString() ?? "",
    sort_order: initial?.sort_order?.toString() ?? "0",
  });
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const miles = parseFloat(form.miles);
    if (!form.from_place.trim() || !form.to_place.trim()) return showToast("From and to required", "error");
    if (!miles || miles <= 0) return showToast("Miles must be > 0", "error");
    setSaving(true);
    const res = await saveMileageRoute({
      id: form.id,
      name: form.name,
      from_place: form.from_place,
      to_place: form.to_place,
      miles,
      sort_order: parseInt(form.sort_order) || 0,
    });
    setSaving(false);
    if (res.error) showToast(res.error, "error");
    else {
      showToast(initial ? "Route updated" : "Route saved");
      onClose();
    }
  }

  return (
    <Modal onClose={onCloseAll} title={initial ? "Edit route" : "Add route"}>
      <form onSubmit={submit}>
        <Field label="Friendly name (optional)" hint='Defaults to "From → To" if left blank'>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Home to Flint Hall" autoFocus />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="From">
            <input className="input" value={form.from_place} onChange={(e) => setForm({ ...form, from_place: e.target.value })} placeholder="e.g. Stowmarket" required />
          </Field>
          <Field label="To">
            <input className="input" value={form.to_place} onChange={(e) => setForm({ ...form, to_place: e.target.value })} placeholder="e.g. Flint Hall" required />
          </Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Field label="Miles">
            <input type="number" step="0.1" min="0" className="input" value={form.miles} onChange={(e) => setForm({ ...form, miles: e.target.value })} required />
          </Field>
          <Field label="Sort order" hint="Lower numbers appear first">
            <input type="number" step="1" className="input" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </Field>
        </div>
        <div className="flex justify-between gap-2 mt-5 pt-4 border-t border-brand-line">
          <button type="button" className="btn-ghost" onClick={onClose}>Back to list</button>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : initial ? "Save changes" : "Add route"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
