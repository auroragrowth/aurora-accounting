import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceTemplate } from "@/components/invoice-template";
import { InvoiceActionsBar } from "@/components/invoice-actions-bar";
import type { Customer, Invoice, Settings } from "@/lib/types";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: settings }, { data: customers }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).maybeSingle(),
    supabase.from("settings").select("*").single(),
    supabase.from("customers").select("*").order("name"),
  ]);

  if (!invoice) notFound();

  return (
    <div>
      <InvoiceActionsBar
        invoice={invoice as Invoice}
        customers={(customers ?? []) as Customer[]}
        settings={settings as Settings}
      />

      <div className="print-area">
        <InvoiceTemplate invoice={invoice as Invoice} settings={settings as Settings} />
      </div>
    </div>
  );
}
