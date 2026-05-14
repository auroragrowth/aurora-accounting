import { createClient } from "@/lib/supabase/server";
import { ContactsView } from "@/components/contacts-view";
import type { Customer, Payee } from "@/lib/types";

export default async function ContactsPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: payees }] = await Promise.all([
    supabase.from("customers").select("*").order("name"),
    supabase.from("payees").select("*").order("name"),
  ]);

  return (
    <ContactsView
      customers={(customers ?? []) as Customer[]}
      payees={(payees ?? []) as Payee[]}
    />
  );
}
