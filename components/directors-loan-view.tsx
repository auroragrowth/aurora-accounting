"use client";

import { useMemo, useState } from "react";
import { Edit3, Trash2, ArrowDownToLine, ArrowUpFromLine, Scale } from "lucide-react";
import { PageHeader, EmptyState, Th, Td } from "./ui";
import { DirectorLoanForm } from "./director-loan-form";
import { useToast } from "./toast-provider";
import { fmtGBP, fmtDate } from "@/lib/utils";
import type { DirectorLoan, LoanDirection } from "@/lib/types";
import { deleteDirectorLoan } from "@/app/(app)/directors-loan/actions";

export function DirectorsLoanView({ loans }: { loans: DirectorLoan[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DirectorLoan | null>(null);
  const [defaultDirection, setDefaultDirection] = useState<LoanDirection>("in");
  const [tab, setTab] = useState<"all" | "in" | "out">("all");
  const { showToast } = useToast();

  const totals = useMemo(() => {
    const inSum = loans.filter((l) => l.direction === "in").reduce((s, l) => s + Number(l.amount), 0);
    const outSum = loans.filter((l) => l.direction === "out").reduce((s, l) => s + Number(l.amount), 0);
    return { inSum, outSum, balance: inSum - outSum };
  }, [loans]);

  const filtered = tab === "all" ? loans : loans.filter((l) => l.direction === tab);

  async function handleDelete(l: DirectorLoan) {
    if (!confirm("Delete this loan entry?")) return;
    const res = await deleteDirectorLoan(l.id);
    if (res.error) showToast(res.error, "error");
    else showToast("Entry deleted");
  }

  function newEntry(direction: LoanDirection) {
    setEditing(null);
    setDefaultDirection(direction);
    setShowForm(true);
  }

  const balanceLabel =
    totals.balance > 0
      ? "Company owes director"
      : totals.balance < 0
      ? "Director owes company"
      : "Square";

  return (
    <div>
      <PageHeader
        title="Director's loan"
        subtitle="Money the director (you) puts into the company, and money the company pays back."
        action={
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => newEntry("out")}>
              <ArrowUpFromLine size={16} /> Loan paid out
            </button>
            <button className="btn-primary" onClick={() => newEntry("in")}>
              <ArrowDownToLine size={16} /> Loan paid in
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Tile
          icon={<ArrowDownToLine size={20} />}
          label="Paid in (director → company)"
          value={fmtGBP(totals.inSum)}
          sub={`${loans.filter((l) => l.direction === "in").length} entries`}
          accent="#0F8A6B"
        />
        <Tile
          icon={<ArrowUpFromLine size={20} />}
          label="Paid out (company → director)"
          value={fmtGBP(totals.outSum)}
          sub={`${loans.filter((l) => l.direction === "out").length} entries`}
          accent="#E8551C"
        />
        <Tile
          icon={<Scale size={20} />}
          label="Outstanding balance"
          value={fmtGBP(Math.abs(totals.balance))}
          sub={balanceLabel}
          accent={totals.balance >= 0 ? "#173F87" : "#C9410B"}
        />
      </div>

      <div className="flex gap-1 mb-5 border-b border-brand-line">
        <SubTab label={`All (${loans.length})`} active={tab === "all"} onClick={() => setTab("all")} />
        <SubTab label={`In (${loans.filter((l) => l.direction === "in").length})`} active={tab === "in"} onClick={() => setTab("in")} />
        <SubTab label={`Out (${loans.filter((l) => l.direction === "out").length})`} active={tab === "out"} onClick={() => setTab("out")} />
      </div>

      <div className="bg-white border border-brand-line rounded-2xl overflow-hidden overflow-x-auto">
        {filtered.length === 0 ? (
          <EmptyState text={loans.length === 0 ? "No director's loan entries yet. Use the buttons above to record one, or one-click import them from the Bank tab." : "No entries match this filter."} />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-line">
                <Th>Date</Th>
                <Th>Direction</Th>
                <Th>Description</Th>
                <Th>Reference</Th>
                <Th className="text-right">Amount</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
                  <Td>{fmtDate(l.date)}</Td>
                  <Td>
                    {l.direction === "in" ? (
                      <span className="pill" style={{ background: "#D1FAE5", color: "#065F46" }}>
                        <ArrowDownToLine size={12} className="inline mr-1" /> In
                      </span>
                    ) : (
                      <span className="pill" style={{ background: "#FED7AA", color: "#9A3412" }}>
                        <ArrowUpFromLine size={12} className="inline mr-1" /> Out
                      </span>
                    )}
                  </Td>
                  <Td className="text-brand-ink-soft">{l.description || "—"}</Td>
                  <Td className="text-brand-ink-soft text-xs">{l.reference || "—"}</Td>
                  <Td className="text-right font-bold">
                    <span className={l.direction === "in" ? "text-brand-green" : "text-brand-orange"}>
                      {l.direction === "in" ? "+" : "−"}{fmtGBP(l.amount)}
                    </span>
                  </Td>
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
        <DirectorLoanForm
          initial={editing}
          defaultDirection={defaultDirection}
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

function SubTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-semibold -mb-px border-b-[3px] transition-colors ${
        active ? "text-brand-blue border-brand-orange" : "text-brand-ink-soft border-transparent hover:text-brand-ink"
      }`}
    >
      {label}
    </button>
  );
}

