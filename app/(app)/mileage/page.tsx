import { createClient } from "@/lib/supabase/server";
import { MileageView } from "@/components/mileage-view";
import type { Mileage, Settings } from "@/lib/types";

export default async function MileagePage() {
  const supabase = await createClient();
  const [{ data: logs }, { data: settings }] = await Promise.all([
    supabase.from("mileage_logs").select("*").order("date", { ascending: false }),
    supabase.from("settings").select("*").single(),
  ]);
  return <MileageView logs={(logs ?? []) as Mileage[]} settings={settings as Settings} />;
}
