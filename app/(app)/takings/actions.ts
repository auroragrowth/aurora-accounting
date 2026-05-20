"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TakingSource } from "@/lib/types";

export interface SaveTakingInput {
  id?: string;
  date: string;
  source: TakingSource;
  amount: number;
  event_name?: string;
  description?: string;
  reference?: string;
}

export async function saveTaking(input: SaveTakingInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.amount || input.amount <= 0) return { error: "Valid amount required" };

  const row = {
    date: input.date,
    source: input.source,
    amount: input.amount,
    event_name: input.event_name?.trim() || null,
    description: input.description?.trim() || null,
    reference: input.reference?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("takings").update(row).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("takings").insert({ user_id: user.id, ...row });
    if (error) return { error: error.message };
  }

  revalidatePath("/takings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTaking(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("takings").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/takings");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============ SumUp payout — gross takings + fee expense in one ============

export interface SumupPayoutEvent {
  date: string;
  event_name: string;
  gross_amount: number;
}

export interface RecordSumupPayoutInput {
  payout_date: string;
  payout_reference: string;
  fees: number;
  fees_note?: string;
  events: SumupPayoutEvent[];
}

export async function recordSumupPayout(input: RecordSumupPayoutInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!input.payout_reference?.trim()) return { error: "Payout reference required" };
  if (!input.events?.length) return { error: "Add at least one event" };
  if (input.fees < 0) return { error: "Fees can't be negative" };
  for (const ev of input.events) {
    if (!ev.event_name?.trim()) return { error: "Each event needs a name" };
    if (!ev.gross_amount || ev.gross_amount <= 0) return { error: `Gross amount must be > 0 for ${ev.event_name}` };
    if (!ev.date) return { error: `Date required for ${ev.event_name}` };
  }

  const ref = input.payout_reference.trim();

  // Insert one taking per event (gross, source=sumup)
  const takingRows = input.events.map((ev) => ({
    user_id: user.id,
    date: ev.date,
    source: "sumup" as const,
    amount: ev.gross_amount,
    event_name: ev.event_name.trim(),
    description: `SumUp gross takings · payout ${ref}`,
    reference: ref,
  }));

  const { error: takErr } = await supabase.from("takings").insert(takingRows);
  if (takErr) return { error: `Could not save takings: ${takErr.message}` };

  // Insert a single fee expense (only if fees > 0)
  if (input.fees > 0) {
    // Auto-add SumUp Payments Limited as a payee if missing
    const { data: existing } = await supabase
      .from("payees")
      .select("id, category")
      .ilike("name", "SumUp Payments Limited")
      .maybeSingle();

    if (!existing) {
      await supabase.from("payees").insert({
        user_id: user.id,
        name: "SumUp Payments Limited",
        category: "other",
        notes: "Card payment processor",
      });
    }

    const desc = input.fees_note?.trim()
      ? `SumUp processing fees · payout ${ref} · ${input.fees_note.trim()}`
      : `SumUp processing fees · payout ${ref}`;

    const { error: expErr } = await supabase.from("expenses").insert({
      user_id: user.id,
      date: input.payout_date,
      category: "other",
      vendor: "SumUp Payments Limited",
      description: desc,
      amount: input.fees,
      payment_method: "card",
      reference: ref,
    });
    if (expErr) return { error: `Could not save fee expense: ${expErr.message}` };
  }

  revalidatePath("/takings");
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  return { success: true };
}
