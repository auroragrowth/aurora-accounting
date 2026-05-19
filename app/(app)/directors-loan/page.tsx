import { createClient } from "@/lib/supabase/server";
import { DirectorsLoanView } from "@/components/directors-loan-view";
import type { DirectorLoan } from "@/lib/types";

export default async function DirectorsLoanPage() {
  const supabase = await createClient();
  const { data: loans } = await supabase
    .from("director_loans")
    .select("*")
    .order("date", { ascending: false });

  return <DirectorsLoanView loans={(loans ?? []) as DirectorLoan[]} />;
}
