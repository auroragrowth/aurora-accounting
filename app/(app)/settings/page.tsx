import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings-form";
import type { Settings } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").single();
  return <SettingsForm initial={data as Settings} />;
}
