import { createClient } from "@/lib/supabase/server";
import { TakingsView } from "@/components/takings-view";
import type { Taking } from "@/lib/types";

export default async function TakingsPage() {
  const supabase = await createClient();
  const { data: takings } = await supabase
    .from("takings")
    .select("*")
    .order("date", { ascending: false });

  return <TakingsView takings={(takings ?? []) as Taking[]} />;
}
