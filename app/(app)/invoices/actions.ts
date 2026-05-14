"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CustomerSnapshot, InvoiceItem, InvoiceStatus } from "@/lib/types";

export interface SaveInvoiceInput {
  id?: string;
  date: string;
  due_date: string;
  customer_id?: string | null;
  customer_snapshot: CustomerSnapshot;
  items: InvoiceItem[];
  notes?: string;
  payment_terms?: string;
  vat_enabled: boolean;
  vat_rate: number;
  status?: InvoiceStatus;
}

export async function saveInvoice(input: SaveInvoiceInput): Promise<{ error?: string; id?: string; invoice_number?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Filter valid items
  const items = (input.items || []).filter(
    (it) => it.description?.trim() && (Number(it.price) || 0) >= 0
  );
  if (items.length === 0) return { error: "Add at least one valid line item" };
  if (!input.customer_snapshot.name?.trim()) return { error: "Customer name required" };

  if (input.id) {
    const { error } = await supabase.from("invoices").update({
      date: input.date,
      due_date: input.due_date,
      customer_id: input.customer_id || null,
      customer_snapshot: input.customer_snapshot,
      items,
      notes: input.notes || null,
      payment_terms: input.payment_terms || null,
      vat_enabled: input.vat_enabled,
      vat_rate: input.vat_rate,
      status: input.status,
    }).eq("id", input.id);
    if (error) return { error: error.message };

    revalidatePath("/invoices");
    revalidatePath(`/invoices/${input.id}`);
    revalidatePath("/dashboard");
    return { id: input.id };
  }

  // New invoice: use the atomic numbering function (uses auth.uid() internally)
  const { data: numData, error: numErr } = await supabase.rpc("next_invoice_number");
  if (numErr) return { error: numErr.message };

  // Auto-save customer
  let customerId = input.customer_id || null;
  const { data: existingCust } = await supabase
    .from("customers")
    .select("id")
    .ilike("name", input.customer_snapshot.name)
    .maybeSingle();

  if (existingCust) {
    customerId = existingCust.id;
    await supabase.from("customers").update({
      email: input.customer_snapshot.email || null,
      address: input.customer_snapshot.address || null,
      city: input.customer_snapshot.city || null,
      postcode: input.customer_snapshot.postcode || null,
      country: input.customer_snapshot.country || null,
    }).eq("id", existingCust.id);
  } else {
    const { data: newCust } = await supabase.from("customers").insert({
      user_id: user.id,
      name: input.customer_snapshot.name,
      email: input.customer_snapshot.email || null,
      address: input.customer_snapshot.address || null,
      city: input.customer_snapshot.city || null,
      postcode: input.customer_snapshot.postcode || null,
      country: input.customer_snapshot.country || "United Kingdom",
    }).select("id").single();
    if (newCust) customerId = newCust.id;
  }

  const { data: inv, error } = await supabase.from("invoices").insert({
    user_id: user.id,
    invoice_number: numData,
    date: input.date,
    due_date: input.due_date,
    customer_id: customerId,
    customer_snapshot: input.customer_snapshot,
    items,
    notes: input.notes || null,
    payment_terms: input.payment_terms || null,
    vat_enabled: input.vat_enabled,
    vat_rate: input.vat_rate,
    status: input.status || "draft",
  }).select("id, invoice_number").single();

  if (error) return { error: error.message };

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { id: inv.id, invoice_number: inv.invoice_number };
}

export async function setInvoiceStatus(id: string, status: InvoiceStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function goToInvoice(id: string) {
  redirect(`/invoices/${id}`);
}
