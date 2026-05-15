"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { CustomerSnapshot, InvoiceItem, QuoteStatus } from "@/lib/types";

export interface SaveQuoteInput {
  id?: string;
  date: string;
  valid_until: string;
  customer_id?: string | null;
  customer_snapshot: CustomerSnapshot;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  vat_enabled: boolean;
  vat_rate: number;
  status?: QuoteStatus;
}

export async function saveQuote(input: SaveQuoteInput): Promise<{ error?: string; id?: string; quote_number?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const items = (input.items || []).filter(
    (it) => it.description?.trim() && (Number(it.price) || 0) >= 0
  );
  if (items.length === 0) return { error: "Add at least one valid line item" };
  if (!input.customer_snapshot.name?.trim()) return { error: "Customer name required" };

  if (input.id) {
    const { error } = await supabase.from("quotes").update({
      date: input.date,
      valid_until: input.valid_until,
      customer_id: input.customer_id || null,
      customer_snapshot: input.customer_snapshot,
      items,
      notes: input.notes || null,
      terms: input.terms || null,
      vat_enabled: input.vat_enabled,
      vat_rate: input.vat_rate,
      status: input.status,
    }).eq("id", input.id);
    if (error) return { error: error.message };

    revalidatePath("/quotes");
    revalidatePath(`/quotes/${input.id}`);
    revalidatePath("/dashboard");
    return { id: input.id };
  }

  const { data: numData, error: numErr } = await supabase.rpc("next_quote_number");
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

  const { data: q, error } = await supabase.from("quotes").insert({
    user_id: user.id,
    quote_number: numData,
    date: input.date,
    valid_until: input.valid_until,
    customer_id: customerId,
    customer_snapshot: input.customer_snapshot,
    items,
    notes: input.notes || null,
    terms: input.terms || null,
    vat_enabled: input.vat_enabled,
    vat_rate: input.vat_rate,
    status: input.status || "draft",
  }).select("id, quote_number").single();

  if (error) return { error: error.message };

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  return { id: q.id, quote_number: q.quote_number };
}

export async function setQuoteStatus(id: string, status: QuoteStatus) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  return { success: true };
}

export async function deleteQuote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/quotes");
  return { success: true };
}

export async function convertQuoteToInvoice(quoteId: string): Promise<{ error?: string; invoiceId?: string; invoiceNumber?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: quote, error: qErr } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (qErr || !quote) return { error: qErr?.message || "Quote not found" };

  if (quote.converted_invoice_id) {
    return { invoiceId: quote.converted_invoice_id };
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("payment_terms")
    .single();

  const { data: numData, error: numErr } = await supabase.rpc("next_invoice_number");
  if (numErr) return { error: numErr.message };

  const today = new Date().toISOString().slice(0, 10);
  const dueDays = 14;
  const due = new Date();
  due.setDate(due.getDate() + dueDays);
  const dueISO = due.toISOString().slice(0, 10);

  const { data: inv, error: invErr } = await supabase.from("invoices").insert({
    user_id: user.id,
    invoice_number: numData,
    date: today,
    due_date: dueISO,
    customer_id: quote.customer_id,
    customer_snapshot: quote.customer_snapshot,
    items: quote.items,
    notes: quote.notes,
    payment_terms: settings?.payment_terms || null,
    vat_enabled: quote.vat_enabled,
    vat_rate: quote.vat_rate,
    status: "draft",
  }).select("id, invoice_number").single();

  if (invErr) return { error: invErr.message };

  await supabase
    .from("quotes")
    .update({ status: "accepted", converted_invoice_id: inv.id })
    .eq("id", quoteId);

  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");

  return { invoiceId: inv.id, invoiceNumber: inv.invoice_number };
}

export async function goToQuote(id: string) {
  redirect(`/quotes/${id}`);
}
