import type { MonzoRow } from "./monzo-csv";

export interface ReconcileLine {
  row: MonzoRow;
  status: "matched" | "unmatched_in" | "unmatched_out" | "skipped";
  matched_against?: { kind: "taking" | "expense"; id: string; date: string; amount: number };
  skip_reason?: string;
}

export interface ReconcileResult {
  errors: string[];
  date_from: string | null;
  date_to: string | null;
  lines: ReconcileLine[];
  totals: {
    matched: { count: number; in_amount: number; out_amount: number };
    unmatched_in: { count: number; amount: number };
    unmatched_out: { count: number; amount: number };
    skipped: number;
  };
}
