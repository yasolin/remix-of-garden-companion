import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type WateringEvent = Tables<"watering_events">;

export interface WateringPlanInput {
  userId: string;
  plantId: string;
  intervalDays: number;
  amountMl?: number;
  startDate?: Date; // last watered or first scheduled
  occurrences?: number; // how many future events to plan
}

/**
 * Generate a plan: 1 event for last watering (completed if startDate in past)
 * and N upcoming scheduled events.
 */
export async function generateWateringPlan(input: WateringPlanInput): Promise<WateringEvent[]> {
  const { userId, plantId, intervalDays, amountMl, startDate = new Date(), occurrences = 12 } = input;

  // Clear existing future scheduled events for this plant
  await supabase
    .from("watering_events")
    .delete()
    .eq("plant_id", plantId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString());

  const events: TablesInsert<"watering_events">[] = [];
  const baseTime = startDate.getTime();
  for (let i = 1; i <= occurrences; i++) {
    const next = new Date(baseTime + i * intervalDays * 24 * 60 * 60 * 1000);
    events.push({
      user_id: userId,
      plant_id: plantId,
      scheduled_at: next.toISOString(),
      amount_ml: amountMl ?? null,
      status: "scheduled",
    });
  }

  if (events.length === 0) return [];

  const { data, error } = await supabase
    .from("watering_events")
    .insert(events)
    .select();
  if (error) throw error;

  // Update plant with next watering date
  const nextDate = events[0].scheduled_at;
  await supabase
    .from("plants")
    .update({
      watering_interval_days: intervalDays,
      watering_amount_ml: amountMl ?? null,
      last_watered_at: startDate.toISOString(),
      next_watering_at: nextDate,
    })
    .eq("id", plantId);

  return data || [];
}

export async function fetchUserWateringEvents(userId: string, fromDate?: Date, toDate?: Date): Promise<WateringEvent[]> {
  let q = supabase.from("watering_events").select("*").eq("user_id", userId);
  if (fromDate) q = q.gte("scheduled_at", fromDate.toISOString());
  if (toDate) q = q.lte("scheduled_at", toDate.toISOString());
  const { data, error } = await q.order("scheduled_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function completeWateringEvent(eventId: string): Promise<void> {
  const { data: ev, error: fetchErr } = await supabase
    .from("watering_events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (fetchErr) throw fetchErr;

  const { error } = await supabase
    .from("watering_events")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", eventId);
  if (error) throw error;

  if (ev) {
    // Update plant last/next watered
    const { data: plant } = await supabase
      .from("plants")
      .select("watering_interval_days")
      .eq("id", ev.plant_id)
      .maybeSingle();
    const interval = plant?.watering_interval_days ?? 3;
    const nextAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("plants")
      .update({
        last_watered_at: new Date().toISOString(),
        next_watering_at: nextAt,
        needs_watering: false,
      })
      .eq("id", ev.plant_id);
  }
}

export async function uncompleteWateringEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from("watering_events")
    .update({ status: "scheduled", completed_at: null })
    .eq("id", eventId);
  if (error) throw error;
}

export async function deleteWateringEvent(eventId: string): Promise<void> {
  const { error } = await supabase.from("watering_events").delete().eq("id", eventId);
  if (error) throw error;
}

export function frequencyToDays(freq: string): number {
  const f = freq.toLowerCase();
  if (f.includes("daily") || f.includes("her gün")) return 1;
  if (f.includes("2 day") || f.includes("2 gün")) return 2;
  if (f.includes("3 day") || f.includes("3 gün")) return 3;
  if (f.includes("week") || f.includes("hafta")) {
    if (f.includes("2 ") || f.includes("biweek")) return 14;
    return 7;
  }
  return 3;
}
