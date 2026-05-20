"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PERIOD_PRESETS } from "@/lib/period";

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
      {PERIOD_PRESETS.map((p) => (
        <option key={p.id} value={p.id}>{p.label}</option>
      ))}
    </select>
  );
}
