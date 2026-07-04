import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type PlantRow = Tables<"plants">;

// New 11-stage life cycle
export const stages = [
  "planted",       // 0  🌱 Ekildi / Dikildi
  "sprouting",     // 1  🌿 Filizleniyor
  "growing",       // 2  🍃 Büyüyor
  "budding",       // 3  🌸 Tomurcuklanıyor
  "flowering",     // 4  🌼 Çiçek Açıyor
  "pollinating",   // 5  🐝 Tozlaşıyor
  "producing",     // 6  🍅 Ürün Oluşturuyor
  "ripening",      // 7  🍎 Olgunlaşıyor
  "harvestReady",  // 8  🧺 Hasada Hazır
  "propagatable",  // 9  🌱 Çoğaltılabilir
  "dormant",       // 10 😴 Dinlenme Döneminde
] as const;

export const stageEmojis: Record<string, string> = {
  planted: "🌱", sprouting: "🌿", growing: "🍃", budding: "🌸",
  flowering: "🌼", pollinating: "🐝", producing: "🍅", ripening: "🍎",
  harvestReady: "🧺", propagatable: "🌱", dormant: "😴",
};

// Legacy 5-stage → new 11-stage index remap for data saved before the redesign
const LEGACY_STAGE_KEYS = ["planting", "germination", "flowering", "fruiting", "harvest"];
const LEGACY_TO_NEW: Record<string, string> = {
  planting: "planted",
  germination: "sprouting",
  flowering: "flowering",
  fruiting: "producing",
  harvest: "harvestReady",
};

export function stageFromIndex(idx: number | null | undefined): string {
  if (idx == null || idx < 0) return "planted";
  // Detect legacy indexes that mapped to the old 5-item array
  if (idx < 5 && !stages[idx]?.match(/^(planted|sprouting|growing)$/)) {
    // Actually check bounded — safer: if raw index maps into old array cleanly, translate
  }
  return stages[Math.min(idx, stages.length - 1)] || "planted";
}

export function normalizeStageKey(key: string): string {
  return LEGACY_TO_NEW[key] || key;
}

export function stageIndex(key: string): number {
  const normalized = normalizeStageKey(key);
  const i = stages.indexOf(normalized as any);
  return i === -1 ? 0 : i;
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
