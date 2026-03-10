import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PlantRow = Tables<"plants">;

export const stages = ["planting", "germination", "flowering", "fruiting", "harvest"] as const;

export function stageFromIndex(idx: number): string {
  return stages[Math.min(idx, stages.length - 1)] || "planting";
}

export async function fetchUserPlants(userId: string): Promise<PlantRow[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchPlantById(id: string): Promise<PlantRow | null> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function insertPlant(plant: TablesInsert<"plants">): Promise<PlantRow> {
  const { data, error } = await supabase
    .from("plants")
    .insert(plant)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePlant(id: string, updates: TablesUpdate<"plants">): Promise<PlantRow> {
  const { data, error } = await supabase
    .from("plants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePlant(id: string): Promise<void> {
  const { error } = await supabase.from("plants").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadPlantPhoto(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("plant-photos").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("plant-photos").getPublicUrl(path);
  return data.publicUrl;
}
