import { createClient } from "@/lib/supabase/server";
import { QuotesView } from "@/components/quotes-view";
import type { Customer, LineItemPreset, Quote, Settings } from "@/lib/types";

export default async function QuotesPage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: customers }, { data: settings }, { data: presets }] = await Promise.all([
    supabase.from("quotes").select("*").order("date", { ascending: false }),
    supabase.from("customers").select("*").order("name"),
    supabase.from("settings").select("*").single(),
    supabase.from("line_item_presets").select("*").order("sort_order").order("description"),
  ]);

  return (
    <QuotesView
      quotes={(quotes ?? []) as Quote[]}
      customers={(customers ?? []) as Customer[]}
      settings={settings as Settings}
      presets={(presets ?? []) as LineItemPreset[]}
    />
  );
}
