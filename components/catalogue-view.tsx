"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2 } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { PresetForm } from "./preset-form";
import { useToast } from "./toast-provider";
import type { LineItemPreset } from "@/lib/types";
import { fmtGBP } from "@/lib/utils";
import { deletePreset } from "@/app/(app)/catalogue/actions";

export function CatalogueView({ presets }: { presets: LineItemPreset[] }) {
  const [editing, setEditing] = useState<LineItemPreset | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const filtered = useMemo(
    () => presets.filter((p) => !search || p.description.toLowerCase().includes(search.toLowerCase())),
    [presets, search]
  );

  async function handleDelete(p: LineItemPreset) {
    if (!confirm(`Remove "${p.description}" from your catalogue?`)) return;
    const res = await deletePreset(p.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Catalogue item removed");
  }

  return (
    <div>
      <PageHeader
        title="Catalogue"
        subtitle={`${presets.length} reusable line items — pick these from the dropdown when building an invoice`}
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> Add item
          </button>
        }
      />

      <div className="mb-5 relative">
        <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
        <input
          className="input pl-10"
          placeholder="Search catalogue…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            text={presets.length === 0 ? "No catalogue items yet. Add your first to start picking from the dropdown." : "No items match your search."}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Description</Th>
                <Th className="text-right">Default qty</Th>
                <Th className="text-right">Default price</Th>
                <Th className="text-right">Sort</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                  <Td><strong>{p.description}</strong></Td>
                  <Td className="text-right">{p.default_qty}</Td>
                  <Td className="text-right font-semibold">
                    {p.default_price > 0 ? fmtGBP(p.default_price) : <span className="text-brand-ink-soft">—</span>}
                  </Td>
                  <Td className="text-right text-brand-ink-soft">{p.sort_order}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button className="btn-ghost" onClick={() => { setEditing(p); setShowForm(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(p)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <PresetForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
