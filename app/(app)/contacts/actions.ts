"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Customer, Payee } from "@/lib/types";

export async function saveCustomer(data: Partial<Customer> & { name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.id) {
    const { error } = await supabase.from("customers").update({
      name: data.name,
      email: data.email,
      address: data.address,
      city: data.city,
      postcode: data.postcode,
      country: data.country,
      notes: data.notes,
    }).eq("id", data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: data.name,
      email: data.email,
      address: data.address,
      city: data.city,
      postcode: data.postcode,
      country: data.country || "United Kingdom",
      notes: data.notes,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/contacts");
  revalidatePath("/invoices");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contacts");
  return { success: true };
}

export async function savePayee(data: Partial<Payee> & { name: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (data.id) {
    const { error } = await supabase.from("payees").update({
      name: data.name,
      category: data.category,
      notes: data.notes,
    }).eq("id", data.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("payees").insert({
      user_id: user.id,
      name: data.name,
      category: data.category || "suppliers",
      notes: data.notes,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/contacts");
  revalidatePath("/expenses");
  return { success: true };
}

export async function deletePayee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payees").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/contacts");
  return { success: true };
}
