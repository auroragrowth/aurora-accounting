import { createClient } from "@/lib/supabase/server";
import { InvoicesView } from "@/components/invoices-view";
import type { Customer, Invoice, Settings } from "@/lib/types";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: customers }, { data: settings }] = await Promise.all([
    supabase.from("invoices").select("*").order("date", { ascending: false }),
    supabase.from("customers").select("*").order("name"),
    supabase.from("settings").select("*").single(),
  ]);

  return (
    <InvoicesView
      invoices={(invoices ?? []) as Invoice[]}
      customers={(customers ?? []) as Customer[]}
      settings={settings as Settings}
    />
  );
}
