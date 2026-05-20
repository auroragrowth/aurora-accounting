"use client";

import { useMemo, useState } from "react";
import { Plus, Edit3, Trash2, Car, MapPin, PoundSterling } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { MileageForm } from "./mileage-form";
import { useToast } from "./toast-provider";
import { fmtGBP, fmtDate } from "@/lib/utils";
import type { Mileage, Settings } from "@/lib/types";
import { deleteMileage } from "@/app/(app)/mileage/actions";

export function MileageView({ logs, settings }: { logs: Mileage[]; settings: Settings }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Mileage | null>(null);
  const { showToast } = useToast();

  const totals = useMemo(() => {
    const totalMiles = logs.reduce((s, l) => s + Number(l.miles), 0);
    const totalClaim = logs.reduce((s, l) => s + Number(l.miles) * Number(l.rate_used), 0);
    const now = new Date();
    const thisMonth = logs.filter((l) => {
      const d = new Date(l.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthMiles = thisMonth.reduce((s, l) => s + Number(l.miles), 0);
    const monthClaim = thisMonth.reduce((s, l) => s + Number(l.miles) * Number(l.rate_used), 0);
    return { totalMiles, totalClaim, monthMiles, monthClaim };
  }, [logs]);

  const knownEvents = useMemo(
    () => Array.from(new Set(logs.map((l) => l.event_name).filter(Boolean) as string[])).sort(),
    [logs]
  );

  async function handleDelete(l: Mileage) {
    if (!confirm("Delete this trip?")) return;
    const res = await deleteMileage(l.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Trip deleted");
  }

  return (
    <div>
      <PageHeader
        title="Mileage log"
        subtitle="HMRC mileage allowance — 45p/mile for the first 10,000 business miles, 25p thereafter."
        action={
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus size={16} /> Log a trip
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Tile icon={<Car size={20} />} label="Total miles" value={totals.totalMiles.toFixed(1)} sub={`${logs.length} trips`} accent="#173F87" />
        <Tile icon={<PoundSterling size={20} />} label="Total claim" value={fmtGBP(totals.totalClaim)} sub="Reclaimable from company" accent="#0F8A6B" />
        <Tile icon={<Car size={20} />} label="Miles this month" value={totals.monthMiles.toFixed(1)} sub="" accent="#7A4DBF" />
        <Tile icon={<PoundSterling size={20} />} label="Claim this month" value={fmtGBP(totals.monthClaim)} sub="" accent="#E8551C" />
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {logs.length === 0 ? (
          <EmptyState text="No trips logged yet. Click 'Log a trip' to start tracking business mileage." />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Date</Th>
                <Th>From → To</Th>
                <Th>Purpose / Event</Th>
                <Th className="text-right">Miles</Th>
                <Th className="text-right">Rate</Th>
                <Th className="text-right">Claim</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                  <Td>{fmtDate(l.date)}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin size={12} className="text-brand-ink-soft" />
                      <span><strong>{l.from_place}</strong> → <strong>{l.to_place}</strong></span>
                    </div>
                  </Td>
                  <Td className="text-brand-ink-soft text-xs">
                    <div>{l.purpose || "—"}</div>
                    {l.event_name && <div className="mt-0.5"><span className="pill" style={{ background: "#7A4DBF15", color: "#7A4DBF" }}>{l.event_name}</span></div>}
                  </Td>
                  <Td className="text-right">{Number(l.miles).toFixed(1)}</Td>
                  <Td className="text-right text-brand-ink-soft text-xs">£{Number(l.rate_used).toFixed(3)}/mi</Td>
                  <Td className="text-right font-bold">{fmtGBP(Number(l.miles) * Number(l.rate_used))}</Td>
                  <Td>
                    <div className="flex gap-1 justify-end">
                      <button className="btn-ghost" onClick={() => { setEditing(l); setShowForm(true); }}>
                        <Edit3 size={14} />
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(l)}>
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
        <MileageForm
          initial={editing}
          defaultRate={Number(settings.mileage_rate_per_mile ?? 0.45)}
          knownEvents={knownEvents}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function Tile({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="stat-card bg-white border border-brand-line rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-brand-ink-soft font-semibold uppercase tracking-wide">{label}</span>
        <div className="w-9 h-9 rounded-[10px] grid place-items-center" style={{ background: `${accent}15`, color: accent }}>
          {icon}
        </div>
      </div>
      <div className="heading-display text-2xl text-brand-ink mb-1">{value}</div>
      <div className="text-xs text-brand-ink-soft">{sub}</div>
    </div>
  );
}
