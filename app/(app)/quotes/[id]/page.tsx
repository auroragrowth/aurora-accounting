import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuoteTemplate } from "@/components/quote-template";
import { QuoteActionsBar } from "@/components/quote-actions-bar";
import type { Customer, LineItemPreset, Quote, Settings } from "@/lib/types";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: settings }, { data: customers }, { data: presets }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).maybeSingle(),
    supabase.from("settings").select("*").single(),
    supabase.from("customers").select("*").order("name"),
    supabase.from("line_item_presets").select("*").order("sort_order").order("description"),
  ]);

  if (!quote) notFound();

  return (
    <div>
      <QuoteActionsBar
        quote={quote as Quote}
        customers={(customers ?? []) as Customer[]}
        settings={settings as Settings}
        presets={(presets ?? []) as LineItemPreset[]}
      />

      <div className="print-area">
        <QuoteTemplate quote={quote as Quote} settings={settings as Settings} />
      </div>
    </div>
  );
}
