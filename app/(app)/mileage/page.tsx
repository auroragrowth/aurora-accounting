import { createClient } from "@/lib/supabase/server";
import { MileageView } from "@/components/mileage-view";
import type { Mileage, MileageRoute, Settings } from "@/lib/types";

export default async function MileagePage() {
  const supabase = await createClient();
  const [{ data: logs }, { data: settings }, { data: routes }] = await Promise.all([
    supabase.from("mileage_logs").select("*").order("date", { ascending: false }),
    supabase.from("settings").select("*").single(),
    supabase.from("mileage_routes").select("*").order("sort_order").order("name"),
  ]);
  return (
    <MileageView
      logs={(logs ?? []) as Mileage[]}
      settings={settings as Settings}
      routes={(routes ?? []) as MileageRoute[]}
    />
  );
}
