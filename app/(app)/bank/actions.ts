"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  parseMonzoCsv,
  shouldSkipMonzoRow,
  guessTakingsSource,
  guessPaymentMethod,
  type MonzoRow,
} from "@/lib/monzo-csv";
import type { ExpenseCategory } from "@/lib/types";
import type { ReconcileLine, ReconcileResult } from "@/lib/bank-types";

const MATCH_DAYS = 3;
const AMOUNT_EPSILON = 0.01;

function daysBetween(a: string, b: string): number {
  return Math.abs((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000);
}

export async function reconcileMonzoCsv(csvText: string): Promise<ReconcileResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      errors: ["Not authenticated"],
      date_from: null, date_to: null, lines: [],
      totals: { matched: { count: 0, in_amount: 0, out_amount: 0 }, unmatched_in: { count: 0, amount: 0 }, unmatched_out: { count: 0, amount: 0 }, skipped: 0 },
    };
  }

  const { rows, errors } = parseMonzoCsv(csvText);
  if (rows.length === 0) {
    return {
      errors: errors.length ? errors : ["No rows found in CSV"],
      date_from: null, date_to: null, lines: [],
      totals: { matched: { count: 0, in_amount: 0, out_amount: 0 }, unmatched_in: { count: 0, amount: 0 }, unmatched_out: { count: 0, amount: 0 }, skipped: 0 },
    };
  }

  const dates = rows.map((r) => r.date).sort();
  const date_from = dates[0];
  const date_to = dates[dates.length - 1];

  // Pad the fetch window so we catch matches near the edges
  const padded = (iso: string, days: number) => {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const fromPad = padded(date_from, -MATCH_DAYS);
  const toPad = padded(date_to, MATCH_DAYS);

  const [{ data: takings }, { data: expenses }] = await Promise.all([
    supabase.from("takings").select("id, date, amount").gte("date", fromPad).lte("date", toPad),
    supabase.from("expenses").select("id, date, amount").gte("date", fromPad).lte("date", toPad),
  ]);

  // Mutable pools — once used, can't be matched again
  const takingsPool = (takings ?? []).map((t) => ({ ...t, used: false }));
  const expensesPool = (expenses ?? []).map((e) => ({ ...e, used: false }));

  const lines: ReconcileLine[] = [];
  let mCount = 0, mIn = 0, mOut = 0;
  let uInCount = 0, uInAmt = 0;
  let uOutCount = 0, uOutAmt = 0;
  let skipped = 0;

  for (const row of rows) {
    const skipReason = shouldSkipMonzoRow(row);
    if (skipReason) {
      lines.push({ row, status: "skipped", skip_reason: skipReason });
      skipped++;
      continue;
    }

    if (row.money_in > 0) {
      // Find closest unused taking match
      const candidates = takingsPool
        .filter((t) => !t.used && Math.abs(Number(t.amount) - row.money_in) < AMOUNT_EPSILON && daysBetween(t.date, row.date) <= MATCH_DAYS)
        .sort((a, b) => daysBetween(a.date, row.date) - daysBetween(b.date, row.date));
      const best = candidates[0];
      if (best) {
        best.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: { kind: "taking", id: best.id, date: best.date, amount: Number(best.amount) },
        });
        mCount++; mIn += row.money_in;
      } else {
        lines.push({ row, status: "unmatched_in" });
        uInCount++; uInAmt += row.money_in;
      }
    } else if (row.money_out > 0) {
      const candidates = expensesPool
        .filter((e) => !e.used && Math.abs(Number(e.amount) - row.money_out) < AMOUNT_EPSILON && daysBetween(e.date, row.date) <= MATCH_DAYS)
        .sort((a, b) => daysBetween(a.date, row.date) - daysBetween(b.date, row.date));
      const best = candidates[0];
      if (best) {
        best.used = true;
        lines.push({
          row,
          status: "matched",
          matched_against: { kind: "expense", id: best.id, date: best.date, amount: Number(best.amount) },
        });
        mCount++; mOut += row.money_out;
      } else {
        lines.push({ row, status: "unmatched_out" });
        uOutCount++; uOutAmt += row.money_out;
      }
    }
  }

  return {
    errors,
    date_from, date_to,
    lines,
    totals: {
      matched: { count: mCount, in_amount: mIn, out_amount: mOut },
      unmatched_in: { count: uInCount, amount: uInAmt },
      unmatched_out: { count: uOutCount, amount: uOutAmt },
      skipped,
    },
  };
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

  // Try to map vendor → existing payee → category
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

  // Auto-add payee if new (mirrors the expense form's behaviour)
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
