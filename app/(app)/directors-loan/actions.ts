"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LoanDirection } from "@/lib/types";

export interface SaveLoanInput {
  id?: string;
  date: string;
  direction: LoanDirection;
  amount: number;
  description?: string;
  reference?: string;
}

export async function saveDirectorLoan(input: SaveLoanInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!input.amount || input.amount <= 0) return { error: "Valid amount required" };

  const row = {
    date: input.date,
    direction: input.direction,
    amount: input.amount,
    description: input.description?.trim() || null,
    reference: input.reference?.trim() || null,
  };

  if (input.id) {
    const { error } = await supabase.from("director_loans").update(row).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("director_loans").insert({ user_id: user.id, ...row });
    if (error) return { error: error.message };
  }

  revalidatePath("/directors-loan");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteDirectorLoan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("director_loans").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/directors-loan");
  revalidatePath("/dashboard");
  return { success: true };
}
