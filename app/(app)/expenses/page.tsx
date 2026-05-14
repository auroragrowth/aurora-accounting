import { createClient } from "@/lib/supabase/server";
import { ExpensesView } from "@/components/expenses-view";
import type { Expense, Payee } from "@/lib/types";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const [{ data: expenses }, { data: payees }] = await Promise.all([
    supabase.from("expenses").select("*").order("date", { ascending: false }),
    supabase.from("payees").select("*").order("name"),
  ]);

  return (
    <ExpensesView
      expenses={(expenses ?? []) as Expense[]}
      payees={(payees ?? []) as Payee[]}
    />
  );
}
