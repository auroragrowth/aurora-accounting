"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRESETS = [
  { id: "this-month",   label: "This month" },
  { id: "last-month",   label: "Last month" },
  { id: "this-quarter", label: "This quarter" },
  { id: "this-year",    label: "This year" },
  { id: "all",          label: "All time" },
];

export function periodRange(preset: string): { from?: string; to?: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === "this-month") return { from: fmt(new Date(y, m, 1)), to: fmt(new Date(y, m + 1, 0)) };
  if (preset === "last-month") return { from: fmt(new Date(y, m - 1, 1)), to: fmt(new Date(y, m, 0)) };
  if (preset === "this-quarter") {
    const qStart = Math.floor(m / 3) * 3;
    return { from: fmt(new Date(y, qStart, 1)), to: fmt(new Date(y, qStart + 3, 0)) };
  }
  if (preset === "this-year") return { from: fmt(new Date(y, 0, 1)), to: fmt(new Date(y, 11, 31)) };
  return {};
}

export function periodLabel(preset: string): string {
  return PRESETS.find((p) => p.id === preset)?.label ?? "All time";
}

export function PeriodPicker({ current }: { current: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function set(value: string) {
    const p = new URLSearchParams(params);
    p.set("period", value);
    router.push(`?${p.toString()}`);
  }

  return (
    <select className="input" style={{ width: "auto", minWidth: 160 }} value={current} onChange={(e) => set(e.target.value)}>
      {PRESETS.map((p) => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
    </select>
  );
}
