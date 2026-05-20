"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface SaveMileageInput {
  id?: string;
  date: string;
  from_place: string;
  to_place: string;
  miles: number;
  purpose?: string;
  event_name?: string;
  rate_used: number;
}

export async function saveMileage(input: SaveMileageInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!input.miles || input.miles <= 0) return { error: "Miles must be > 0" };
  if (!input.from_place?.trim() || !input.to_place?.trim()) return { error: "From and to required" };

  const row = {
    date: input.date,
    from_place: input.from_place.trim(),
    to_place: input.to_place.trim(),
    miles: input.miles,
    purpose: input.purpose?.trim() || null,
    event_name: input.event_name?.trim() || null,
    rate_used: input.rate_used,
  };

  if (input.id) {
    const { error } = await supabase.from("mileage_logs").update(row).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("mileage_logs").insert({ user_id: user.id, ...row });
    if (error) return { error: error.message };
  }

  revalidatePath("/mileage");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMileage(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mileage_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mileage");
  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============ Saved routes ============

export interface SaveRouteInput {
  id?: string;
  name?: string;
  from_place: string;
  to_place: string;
  miles: number;
  sort_order?: number;
}

export async function saveMileageRoute(input: SaveRouteInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  if (!input.from_place?.trim() || !input.to_place?.trim()) return { error: "From and to required" };
  if (!input.miles || input.miles <= 0) return { error: "Miles must be > 0" };

  const row = {
    name: input.name?.trim() || null,
    from_place: input.from_place.trim(),
    to_place: input.to_place.trim(),
    miles: input.miles,
    sort_order: input.sort_order ?? 0,
  };

  if (input.id) {
    const { error } = await supabase.from("mileage_routes").update(row).eq("id", input.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("mileage_routes").insert({ user_id: user.id, ...row });
    if (error) return { error: error.message };
  }

  revalidatePath("/mileage");
  return { success: true };
}

export async function deleteMileageRoute(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("mileage_routes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/mileage");
  return { success: true };
}
