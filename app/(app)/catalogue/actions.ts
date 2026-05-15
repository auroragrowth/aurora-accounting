"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LineItemPreset } from "@/lib/types";

export interface SavePresetInput {
  id?: string;
  description: string;
  default_qty: number;
  default_price: number;
  sort_order?: number;
}

export async function savePreset(data: SavePresetInput): Promise<{ error?: string; preset?: LineItemPreset }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!data.description?.trim()) return { error: "Description is required" };

  if (data.id) {
    const { error } = await supabase.from("line_item_presets").update({
      description: data.description.trim(),
      default_qty: data.default_qty,
      default_price: data.default_price,
      sort_order: data.sort_order ?? 0,
    }).eq("id", data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("line_item_presets").insert({
      user_id: user.id,
      description: data.description.trim(),
      default_qty: data.default_qty,
      default_price: data.default_price,
      sort_order: data.sort_order ?? 0,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/catalogue");
  revalidatePath("/invoices");
  return { success: true } as { error?: string; preset?: LineItemPreset };
}

export async function deletePreset(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("line_item_presets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalogue");
  revalidatePath("/invoices");
  return { success: true };
}
