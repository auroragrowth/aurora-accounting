"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  parseMonzoCsv,
  shouldSkipMonzoRow,
  classifyDirectorLoan,
  guessTakingsSource,
  guessPaymentMethod,
  type MonzoRow,
} from "@/lib/monzo-csv";
import type { ExpenseCategory, Invoice } from "@/lib/types";
import { invoiceTotal } from "@/lib/utils";
import type { ReconcileLine, ReconcileResult } from "@/lib/bank-types";

const MATCH_DAYS = 3;
const INVOICE_MATCH_DAYS = 60;
const AMOUNT_EPSILON = 0.01;

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

function emptyTotals(): ReconcileResult["totals"] {
  return {
    matched: { count: 0, in_amount: 0, out_amount: 0 },
    unmatched_in: { count: 0, amount: 0 },
    unmatched_out: { count: 0, amount: 0 },
    unmatched_loan_in: { count: 0, amount: 0 },
    unmatched_loan_out: { count: 0, amount: 0 },
    skipped: 0,
  };
}

export async function reconcileMonzoCsv(csvText: string): Promise<ReconcileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { errors: ["Not authenticated"], date_from: null, date_to: null, lines: [], totals: emptyTotals() };
  }

  const { rows, errors } = parseMonzoCsv(csvText);
  if (rows.length === 0) {
    return { errors: errors.length ? errors : ["No rows found in CSV"], date_from: null, date_to: null, lines: [], totals: emptyTotals() };
  }

  const dates = rows.map((r) => r.date).sort();
  const date_from = dates[0];
  const date_to = dates[dates.length - 1];

  const padded = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const fromPad = padded(date_from, -MATCH_DAYS);
  const toPad = padded(date_to, MATCH_DAYS);
  const invFromPad = padded(date_from, -INVOICE_MATCH_DAYS);
  const invToPad = padded(date_to, INVOICE_MATCH_DAYS);

  const [
    { data: takings },
    { data: expenses },
    { data: invoices },
    { data: directorLoans },
  ] = await Promise.all([
    supabase.from("takings").select("id, date, amount").gte("date", fromPad).lte("date", toPad),
    supabase.from("expenses").select("id, date, amount").gte("date", fromPad).lte("date", toPad),
    supabase.from("invoices").select("*").eq("status", "paid").gte("date", invFromPad).lte("date", invToPad),
    supabase.from("director_loans").select("id, date, amount, direction").gte("date", fromPad).lte("date", toPad),
  ]);

  const takingsPool = (takings ?? []).map((t) => ({ ...t, used: false }));
  const expensesPool = (expenses ?? []).map((e) => ({ ...e, used: false }));
  const invoicesPool = (invoices ?? []).map((inv) => ({
    inv: inv as Invoice,
    total: invoiceTotal(inv as Invoice),
    used: false,
  }));
  const dlInPool = (directorLoans ?? []).filter((d) => d.direction === "in").map((d) => ({ ...d, used: false }));
  const dlOutPool = (directorLoans ?? []).filter((d) => d.direction === "out").map((d) => ({ ...d, used: false }));

  const lines: ReconcileLine[] = [];
  const totals = emptyTotals();

  for (const row of rows) {
    // 1) Director's loan?
    const dlDir = classifyDirectorLoan(row);
    if (dlDir) {
      const amount = dlDir === "in" ? row.money_in : row.money_out;
      const pool = dlDir === "in" ? dlInPool : dlOutPool;
      const candidates = pool
        .filter((d) => !d.used && Math.abs(Number(d.amount) - amount) < AMOUNT_EPSILON && daysBetween(d.date, row.date) <= MATCH_DAYS)
        .sort((a, b) => daysBetween(a.date, row.date) - daysBetween(b.date, row.date));
      const best = candidates[0];
      if (best) {
        best.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: { kind: "director_loan", id: best.id, date: best.date, amount: Number(best.amount), label: dlDir === "in" ? "loan in" : "loan out" },
        });
        totals.matched.count++;
        if (dlDir === "in") totals.matched.in_amount += amount; else totals.matched.out_amount += amount;
      } else {
        if (dlDir === "in") {
          lines.push({ row, status: "unmatched_loan_in" });
          totals.unmatched_loan_in.count++;
          totals.unmatched_loan_in.amount += amount;
        } else {
          lines.push({ row, status: "unmatched_loan_out" });
          totals.unmatched_loan_out.count++;
          totals.unmatched_loan_out.amount += amount;
        }
      }
      continue;
    }

    // 2) Auto-skip?
    const skipReason = shouldSkipMonzoRow(row);
    if (skipReason) {
      lines.push({ row, status: "skipped", skip_reason: skipReason });
      totals.skipped++;
      continue;
    }

    // 3) Money in → takings first, then paid invoices
    if (row.money_in > 0) {
      const takingMatch = takingsPool
        .filter((t) => !t.used && Math.abs(Number(t.amount) - row.money_in) < AMOUNT_EPSILON && daysBetween(t.date, row.date) <= MATCH_DAYS)
        .sort((a, b) => daysBetween(a.date, row.date) - daysBetween(b.date, row.date))[0];
      if (takingMatch) {
        takingMatch.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: { kind: "taking", id: takingMatch.id, date: takingMatch.date, amount: Number(takingMatch.amount) },
        });
        totals.matched.count++;
        totals.matched.in_amount += row.money_in;
        continue;
      }

      const invoiceMatch = invoicesPool
        .filter((p) => !p.used && Math.abs(p.total - row.money_in) < AMOUNT_EPSILON && daysBetween(p.inv.date, row.date) <= INVOICE_MATCH_DAYS)
        .sort((a, b) => daysBetween(a.inv.date, row.date) - daysBetween(b.inv.date, row.date))[0];
      if (invoiceMatch) {
        invoiceMatch.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: {
            kind: "invoice",
            id: invoiceMatch.inv.id,
            date: invoiceMatch.inv.date,
            amount: invoiceMatch.total,
            label: invoiceMatch.inv.invoice_number,
          },
        });
        totals.matched.count++;
        totals.matched.in_amount += row.money_in;
        continue;
      }

      lines.push({ row, status: "unmatched_in" });
      totals.unmatched_in.count++;
      totals.unmatched_in.amount += row.money_in;
      continue;
    }

    // 4) Money out → expenses
    if (row.money_out > 0) {
      const expMatch = expensesPool
        .filter((e) => !e.used && Math.abs(Number(e.amount) - row.money_out) < AMOUNT_EPSILON && daysBetween(e.date, row.date) <= MATCH_DAYS)
        .sort((a, b) => daysBetween(a.date, row.date) - daysBetween(b.date, row.date))[0];
      if (expMatch) {
        expMatch.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: { kind: "expense", id: expMatch.id, date: expMatch.date, amount: Number(expMatch.amount) },
        });
        totals.matched.count++;
        totals.matched.out_amount += row.money_out;
      } else {
        lines.push({ row, status: "unmatched_out" });
        totals.unmatched_out.count++;
        totals.unmatched_out.amount += row.money_out;
      }
    }
  }

  return { errors, date_from, date_to, lines, totals };
}

// ============ Quick-import actions ============

export async function importBankRowAsTaking(row: MonzoRow): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const source = guessTakingsSource(row);
  const description = [row.name, row.notes].filter(Boolean).join(" — ");

  const { error } = await supabase.from("takings").insert({
    user_id: user.id,
    date: row.date,
    source,
    amount: row.money_in,
    description: description.slice(0, 500),
    reference: row.notes || row.transaction_id,
  });
  if (error) return { error: error.message };

  revalidatePath("/bank");
  revalidatePath("/takings");
  revalidatePath("/dashboard");
  return {};
}

export async function importBankRowAsExpense(row: MonzoRow): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: payee } = await supabase
    .from("payees")
    .select("category")
    .ilike("name", row.name)
    .maybeSingle();

  const category = (payee?.category as ExpenseCategory) ?? "other";
  const payment_method = guessPaymentMethod(row);

  const { error } = await supabase.from("expenses").insert({
    user_id: user.id,
    date: row.date,
    category,
    vendor: row.name,
    description: row.notes || row.description || null,
    amount: row.money_out,
    payment_method: payment_method || null,
    reference: row.transaction_id || null,
  });
  if (error) return { error: error.message };

  if (!payee) {
    await supabase.from("payees").insert({
      user_id: user.id,
      name: row.name,
      category,
    });
  }

  revalidatePath("/bank");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return {};
}

export async function importBankRowAsDirectorLoan(row: MonzoRow): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const direction = classifyDirectorLoan(row);
  if (!direction) return { error: "Could not classify this row as a director's loan" };

  const amount = direction === "in" ? row.money_in : row.money_out;

  const { error } = await supabase.from("director_loans").insert({
    user_id: user.id,
    date: row.date,
    direction,
    amount,
    description: row.notes || row.description || null,
    reference: row.transaction_id || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/bank");
  revalidatePath("/directors-loan");
  revalidatePath("/dashboard");
  return {};
}
