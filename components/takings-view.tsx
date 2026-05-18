"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Edit3, Trash2, Download } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { TakingForm } from "./taking-form";
import { useToast } from "./toast-provider";
import { fmtGBP, fmtDate, todayISO } from "@/lib/utils";
import type { Taking } from "@/lib/types";
import { TAKINGS_SOURCES, takingsSourceLabel } from "@/lib/types";
import { deleteTaking } from "@/app/(app)/takings/actions";

export function TakingsView({ takings }: { takings: Taking[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Taking | null>(null);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const filtered = useMemo(
    () =>
      takings.filter((t) => {
        if (filterSource !== "all" && t.source !== filterSource) return false;
        if (search && !`${t.event_name ?? ""} ${t.description ?? ""} ${t.reference ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [takings, filterSource, search]
  );

  const total = filtered.reduce((s, t) => s + Number(t.amount), 0);

  const now = new Date();
  const monthTotal = takings
    .filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + Number(t.amount), 0);

  async function handleDelete(t: Taking) {
    if (!confirm("Delete this takings entry?")) return;
    const res = await deleteTaking(t.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Takings entry deleted");
  }

  function exportCSV() {
    const rows: string[][] = [["Date", "Source", "Event", "Description", "Amount", "Reference"]];
    filtered.forEach((t) => {
      rows.push([
        t.date,
        takingsSourceLabel(t.source),
        t.event_name ?? "",
        t.description ?? "",
        Number(t.amount).toFixed(2),
        t.reference ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takings_${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Income / Takings"
        subtitle={`${filtered.length} entries · ${fmtGBP(total)} shown · ${fmtGBP(monthTotal)} this month`}
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </button>
            <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
              <Plus size={16} /> Record takings
            </button>
          </div>
        }
      />

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[240px] relative">
          <Search size={16} className="absolute left-3.5 top-3.5 text-brand-ink-soft" />
          <input
            className="input pl-10"
            placeholder="Search event, description, reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: "auto", minWidth: 180 }} value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <option value="all">All sources</option>
          {TAKINGS_SOURCES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState
            text={takings.length === 0 ? "No takings recorded yet. Add your SumUp, Square and cash income to get started." : "No takings match your filters."}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Date</Th>
                <Th>Source</Th>
                <Th>Event</Th>
                <Th>Description</Th>
                <Th className="text-right">Amount</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const src = TAKINGS_SOURCES.find((s) => s.id === t.source);
                return (
                  <tr key={t.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                    <Td>{fmtDate(t.date)}</Td>
                    <Td>
                      {src && (
                        <span className="pill" style={{ background: `${src.color}15`, color: src.color }}>
                          {src.label}
                        </span>
                      )}
                    </Td>
                    <Td>
                      <strong>{t.event_name || "—"}</strong>
                      {t.reference && <div className="text-[11px] text-brand-ink-soft mt-0.5">Ref: {t.reference}</div>}
                    </Td>
                    <Td className="text-brand-ink-soft">{t.description}</Td>
                    <Td className="text-right font-bold">{fmtGBP(t.amount)}</Td>
                    <Td>
                      <div className="flex gap-1 justify-end">
                        <button className="btn-ghost" onClick={() => { setEditing(t); setShowForm(true); }}>
                          <Edit3 size={14} />
                        </button>
                        <button className="btn-danger" onClick={() => handleDelete(t)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <TakingForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
