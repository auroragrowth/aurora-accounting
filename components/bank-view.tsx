"use client";

import { useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, FileText, Plus, Landmark } from "lucide-react";
import { PageHeader, EmptyState, Th, Td, Card } from "./ui";
import { useToast } from "./toast-provider";
import { fmtGBP, fmtDate } from "@/lib/utils";
import { reconcileMonzoCsv, importBankRowAsTaking, importBankRowAsExpense, importBankRowAsDirectorLoan } from "@/app/(app)/bank/actions";
import type { ReconcileResult, ReconcileLine } from "@/lib/bank-types";

export function BankView() {
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState<string | null>(null);
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [showMatched, setShowMatched] = useState(false);
  const [showSkipped, setShowSkipped] = useState(false);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast("CSV too large (max 5MB)", "error");
      return;
    }
    setBusy(true);
    setFilename(file.name);
    setImported(new Set());
    try {
      const text = await file.text();
      const res = await reconcileMonzoCsv(text);
      setResult(res);
      if (res.errors.length) {
        showToast(`Processed with ${res.errors.length} warning(s)`, "error");
      }
    } catch (err) {
      showToast("Couldn't read file: " + (err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  function lineKey(line: ReconcileLine): string {
    return line.row.transaction_id || `${line.row.date}|${line.row.name}|${line.row.money_in}|${line.row.money_out}`;
  }

  async function importTaking(line: ReconcileLine) {
    const key = lineKey(line);
    setImported((s) => new Set(s).add(key));
    const res = await importBankRowAsTaking(line.row);
    if (res.error) {
      setImported((s) => { const n = new Set(s); n.delete(key); return n; });
      showToast(res.error, "error");
    } else {
      showToast("Added to takings");
    }
  }

  async function importExpense(line: ReconcileLine) {
    const key = lineKey(line);
    setImported((s) => new Set(s).add(key));
    const res = await importBankRowAsExpense(line.row);
    if (res.error) {
      setImported((s) => { const n = new Set(s); n.delete(key); return n; });
      showToast(res.error, "error");
    } else {
      showToast("Added to expenses");
    }
  }

  async function importLoan(line: ReconcileLine) {
    const key = lineKey(line);
    setImported((s) => new Set(s).add(key));
    const res = await importBankRowAsDirectorLoan(line.row);
    if (res.error) {
      setImported((s) => { const n = new Set(s); n.delete(key); return n; });
      showToast(res.error, "error");
    } else {
      showToast("Added to director's loan");
    }
  }

  const matched = result?.lines.filter((l) => l.status === "matched") ?? [];
  const unmatchedIn = result?.lines.filter((l) => l.status === "unmatched_in") ?? [];
  const unmatchedOut = result?.lines.filter((l) => l.status === "unmatched_out") ?? [];
  const unmatchedLoanIn = result?.lines.filter((l) => l.status === "unmatched_loan_in") ?? [];
  const unmatchedLoanOut = result?.lines.filter((l) => l.status === "unmatched_loan_out") ?? [];
  const skipped = result?.lines.filter((l) => l.status === "skipped") ?? [];

  return (
    <div>
      <PageHeader
        title="Bank reconciliation"
        subtitle="Upload a Monzo CSV — anything missing from the system gets flagged with a one-click import."
        action={
          <div className="flex gap-2 items-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload size={16} /> {busy ? "Processing…" : result ? "Upload another CSV" : "Upload Monzo CSV"}
            </button>
          </div>
        }
      />

      {!result && !busy && (
        <Card>
          <EmptyState text="No statement uploaded yet. Drop in a Monzo CSV to see what's missing from your records." />
        </Card>
      )}

      {result && (
        <>
          {result.errors.length > 0 && (
            <Card className="mb-5">
              <div className="text-sm text-brand-ink-soft">
                <strong>Warnings:</strong>
                <ul className="list-disc ml-5 mt-1">
                  {result.errors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
                  {result.errors.length > 8 && <li>…and {result.errors.length - 8} more</li>}
                </ul>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <SummaryTile
              icon={<CheckCircle2 size={20} />}
              label="Matched"
              value={`${result.totals.matched.count}`}
              sub={`${fmtGBP(result.totals.matched.in_amount)} in · ${fmtGBP(result.totals.matched.out_amount)} out`}
              accent="#0F8A6B"
            />
            <SummaryTile
              icon={<AlertTriangle size={20} />}
              label="Money in not on system"
              value={`${result.totals.unmatched_in.count}`}
              sub={fmtGBP(result.totals.unmatched_in.amount)}
              accent="#BD8B00"
            />
            <SummaryTile
              icon={<AlertTriangle size={20} />}
              label="Money out not on system"
              value={`${result.totals.unmatched_out.count}`}
              sub={fmtGBP(result.totals.unmatched_out.amount)}
              accent="#E8551C"
            />
            <SummaryTile
              icon={<Landmark size={20} />}
              label="Director's loan to record"
              value={`${result.totals.unmatched_loan_in.count + result.totals.unmatched_loan_out.count}`}
              sub={`${fmtGBP(result.totals.unmatched_loan_in.amount)} in · ${fmtGBP(result.totals.unmatched_loan_out.amount)} out`}
              accent="#7A4DBF"
            />
            <SummaryTile
              icon={<FileText size={20} />}
              label="Range"
              value={result.date_from && result.date_to ? `${result.lines.length} lines` : "—"}
              sub={result.date_from && result.date_to ? `${fmtDate(result.date_from)} → ${fmtDate(result.date_to)}` : (filename ?? "")}
              accent="#173F87"
            />
          </div>

          {unmatchedIn.length > 0 && (
            <Card title="Money in — not on system" className="mb-5">
              <DiscrepancyTable
                lines={unmatchedIn}
                direction="in"
                onImport={importTaking}
                imported={imported}
                lineKey={lineKey}
                importLabel="Add to takings"
              />
            </Card>
          )}

          {unmatchedOut.length > 0 && (
            <Card title="Money out — not on system" className="mb-5">
              <DiscrepancyTable
                lines={unmatchedOut}
                direction="out"
                onImport={importExpense}
                imported={imported}
                lineKey={lineKey}
                importLabel="Add to expenses"
              />
            </Card>
          )}

          {unmatchedLoanIn.length > 0 && (
            <Card title="Director's loan paid in — not on system" className="mb-5">
              <DiscrepancyTable
                lines={unmatchedLoanIn}
                direction="in"
                onImport={importLoan}
                imported={imported}
                lineKey={lineKey}
                importLabel="Add to director's loan"
              />
            </Card>
          )}

          {unmatchedLoanOut.length > 0 && (
            <Card title="Director's loan paid out — not on system" className="mb-5">
              <DiscrepancyTable
                lines={unmatchedLoanOut}
                direction="out"
                onImport={importLoan}
                imported={imported}
                lineKey={lineKey}
                importLabel="Add to director's loan"
              />
            </Card>
          )}

          {unmatchedIn.length === 0 && unmatchedOut.length === 0 && unmatchedLoanIn.length === 0 && unmatchedLoanOut.length === 0 && (
            <Card className="mb-5">
              <div className="py-8 text-center text-sm">
                <CheckCircle2 className="inline-block text-brand-green mr-2" size={20} />
                Every bank line on this statement is already on the system. Nothing to reconcile.
              </div>
            </Card>
          )}

          {matched.length > 0 && (
            <Card className="mb-5">
              <button
                className="flex items-center gap-2 text-sm font-bold text-brand-ink hover:text-brand-blue"
                onClick={() => setShowMatched(!showMatched)}
              >
                {showMatched ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Matched ({matched.length})
              </button>
              {showMatched && (
                <div className="mt-4">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-brand-cream border-b border-brand-line">
                        <Th>Date</Th>
                        <Th>Name</Th>
                        <Th className="text-right">Amount</Th>
                        <Th>Matched to</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {matched.map((l) => (
                        <tr key={lineKey(l)} className="border-b border-brand-line last:border-0">
                          <Td>{fmtDate(l.row.date)}</Td>
                          <Td>{l.row.name}</Td>
                          <Td className="text-right">
                            {l.row.money_in > 0 ? (
                              <span className="text-brand-green font-semibold">+{fmtGBP(l.row.money_in)}</span>
                            ) : (
                              <span className="text-brand-orange font-semibold">−{fmtGBP(l.row.money_out)}</span>
                            )}
                          </Td>
                          <Td className="text-brand-ink-soft text-xs">
                            {(() => {
                              const k = l.matched_against?.kind;
                              const lbl = l.matched_against?.label;
                              const kindLabel =
                                k === "invoice" ? `Invoice ${lbl ?? ""}`.trim() :
                                k === "director_loan" ? `Director's loan ${lbl ?? ""}`.trim() :
                                k === "taking" ? "Takings" :
                                k === "expense" ? "Expense" : (k ?? "");
                              return `${kindLabel} · ${fmtDate(l.matched_against?.date ?? "")}`;
                            })()}
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {skipped.length > 0 && (
            <Card>
              <button
                className="flex items-center gap-2 text-sm font-bold text-brand-ink hover:text-brand-blue"
                onClick={() => setShowSkipped(!showSkipped)}
              >
                {showSkipped ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                Skipped ({skipped.length}) — personal transfers & ATM withdrawals
              </button>
              {showSkipped && (
                <div className="mt-4 text-sm text-brand-ink-soft">
                  {skipped.map((l, i) => (
                    <div key={i} className="flex justify-between py-1 border-b border-brand-line last:border-0">
                      <span>{fmtDate(l.row.date)} · {l.row.name}</span>
                      <span>{l.skip_reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryTile({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string; sub: string; accent: string }) {
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

function DiscrepancyTable({
  lines,
  direction,
  onImport,
  imported,
  lineKey,
  importLabel,
}: {
  lines: ReconcileLine[];
  direction: "in" | "out";
  onImport: (l: ReconcileLine) => void;
  imported: Set<string>;
  lineKey: (l: ReconcileLine) => string;
  importLabel: string;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-brand-cream border-b border-brand-line">
          <Th>Date</Th>
          <Th>Name / Description</Th>
          <Th>Type</Th>
          <Th className="text-right">Amount</Th>
          <Th></Th>
        </tr>
      </thead>
      <tbody>
        {lines.map((l) => {
          const key = lineKey(l);
          const isImported = imported.has(key);
          const amount = direction === "in" ? l.row.money_in : l.row.money_out;
          return (
            <tr key={key} className="border-b border-brand-line last:border-0 hover:bg-brand-cream/60">
              <Td>{fmtDate(l.row.date)}</Td>
              <Td>
                <strong>{l.row.name || "—"}</strong>
                {l.row.notes && <div className="text-[11px] text-brand-ink-soft mt-0.5">{l.row.notes}</div>}
              </Td>
              <Td className="text-brand-ink-soft text-xs">{l.row.type}</Td>
              <Td className="text-right">
                <span className={direction === "in" ? "text-brand-green font-bold" : "text-brand-orange font-bold"}>
                  {direction === "in" ? "+" : "−"}{fmtGBP(amount)}
                </span>
              </Td>
              <Td>
                <div className="flex justify-end">
                  {isImported ? (
                    <span className="pill text-xs" style={{ background: "#D1FAE5", color: "#065F46" }}>
                      <CheckCircle2 size={12} className="inline mr-1" />
                      Added
                    </span>
                  ) : (
                    <button className="btn-secondary text-xs" onClick={() => onImport(l)}>
                      <Plus size={12} /> {importLabel}
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
