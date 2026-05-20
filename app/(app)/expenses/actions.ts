"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Expense, ExpenseCategory } from "@/lib/types";

export interface SaveExpenseInput {
  id?: string;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  description?: string;
  amount: number;
  payment_method?: string;
  reference?: string;
  event_name?: string;
  receipt_path?: string | null;
  receipt_type?: string | null;
  receipt_name?: string | null;
  /** If true, drops existing receipt_path on update */
  remove_receipt?: boolean;
}

export async function saveExpense(input: SaveExpenseInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (input.id) {
    // Fetch existing to know what to do with old receipt
    const { data: existing } = await supabase
      .from("expenses")
      .select("receipt_path")
      .eq("id", input.id)
      .single();

    // If a new receipt path was provided OR remove was requested, delete the old file
    if (existing?.receipt_path && (input.receipt_path || input.remove_receipt) && existing.receipt_path !== input.receipt_path) {
      await supabase.storage.from("receipts").remove([existing.receipt_path]);
    }

    const updateData: Record<string, unknown> = {
      date: input.date,
      category: input.category,
      vendor: input.vendor,
      description: input.description || null,
      amount: input.amount,
      payment_method: input.payment_method || null,
      reference: input.reference || null,
      event_name: input.event_name?.trim() || null,
    };
    if (input.receipt_path !== undefined) {
      updateData.receipt_path = input.receipt_path;
      updateData.receipt_type = input.receipt_type;
      updateData.receipt_name = input.receipt_name;
    }
    if (input.remove_receipt) {
      updateData.receipt_path = null;
      updateData.receipt_type = null;
      updateData.receipt_name = null;
    }

    const { error } = await supabase.from("expenses").update(updateData).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("expenses").insert({
      user_id: user.id,
      date: input.date,
      category: input.category,
      vendor: input.vendor,
      description: input.description || null,
      amount: input.amount,
      payment_method: input.payment_method || null,
      reference: input.reference || null,
      event_name: input.event_name?.trim() || null,
      receipt_path: input.receipt_path || null,
      receipt_type: input.receipt_type || null,
      receipt_name: input.receipt_name || null,
    });
    if (error) return { error: error.message };

    // Auto-add payee if new
    const { data: existingPayee } = await supabase
      .from("payees")
      .select("id")
      .ilike("name", input.vendor)
      .maybeSingle();

    if (!existingPayee) {
      await supabase.from("payees").insert({
        user_id: user.id,
        name: input.vendor,
        category: input.category,
      });
    }
  }

  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  const { data: exp } = await supabase
    .from("expenses")
    .select("receipt_path")
    .eq("id", id)
    .single();

  if (exp?.receipt_path) {
    await supabase.storage.from("receipts").remove([exp.receipt_path]);
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getReceiptUrl(path: string): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("receipts")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  if (error) return { url: null, error: error.message };
  return { url: data.signedUrl };
}
