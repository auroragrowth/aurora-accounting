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
