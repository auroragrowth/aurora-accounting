import { createClient } from "@/lib/supabase/server";
import { CatalogueView } from "@/components/catalogue-view";
import type { LineItemPreset } from "@/lib/types";

export default async function CataloguePage() {
  const supabase = await createClient();
  const { data: presets } = await supabase
    .from("line_item_presets")
    .select("*")
    .order("sort_order")
    .order("description");

  return <CatalogueView presets={(presets ?? []) as LineItemPreset[]} />;
}
