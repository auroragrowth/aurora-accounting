"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PotKind } from "@/lib/types";

export interface SavePotAllocationInput {
  id?: string;
  pot: PotKind;
  date: string;
  amount: number;
  note?: string;
}

export async function savePotAllocation(input: SavePotAllocationInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!input.amount || input.amount <= 0) return { error: "Amount must be > 0" };

  const row = {
    pot: input.pot,
    date: input.date,
    amount: input.amount,
    note: input.note?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("pot_allocations").update(row).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("pot_allocations").insert({ user_id: user.id, ...row });
    if (error) return { error: error.message };
  }

  revalidatePath("/pots");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePotAllocation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pot_allocations").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/pots");
  revalidatePath("/dashboard");
  return { success: true };
}
