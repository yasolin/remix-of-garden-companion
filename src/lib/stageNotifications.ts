import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "./notificationService";
import type { PlantRow } from "./plantService";

// Stage definitions with day offsets from planted_date
// germination ~7d, flowering ~30d, fruiting ~60d, harvest = days_to_harvest
const STAGE_KEYS = ["germination", "flowering", "fruiting", "harvest"] as const;
type StageKey = typeof STAGE_KEYS[number];

const STAGE_LABELS_TR: Record<StageKey, string> = {
  germination: "Çimlenme",
  flowering: "Çiçeklenme",
  fruiting: "Meyve",
  harvest: "Hasat",
};

function getStageDates(plant: PlantRow): Record<StageKey, Date | null> {
  if (!plant.planted_date) {
    return { germination: null, flowering: null, fruiting: null, harvest: null };
  }
  const planted = new Date(plant.planted_date).getTime();
  const day = 24 * 60 * 60 * 1000;
  const harvestDays = plant.days_to_harvest ?? 60;
  return {
    germination: new Date(planted + 7 * day),
    flowering: new Date(planted + Math.max(14, harvestDays * 0.4) * day),
    fruiting: new Date(planted + Math.max(21, harvestDays * 0.7) * day),
    harvest: new Date(planted + harvestDays * day),
  };
}

/**
 * Check all user plants and create notifications for stages that are <7 days away
 * and haven't been notified yet (deduped by related_id = `${plantId}:${stage}`).
 */
export async function checkAndCreateStageNotifications(userId: string, plants: PlantRow[]) {
  if (!plants.length) return;

  // Fetch existing stage notifications to dedupe
  const { data: existing } = await supabase
    .from("notifications" as any)
    .select("related_id, type")
    .eq("user_id", userId)
    .in("type", ["stage_germination", "stage_flowering", "stage_fruiting", "stage_harvest"]);

  const existingKeys = new Set((existing as any[] || []).map(n => n.related_id));

  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  for (const plant of plants) {
    const dates = getStageDates(plant);
    for (const stage of STAGE_KEYS) {
      const d = dates[stage];
      if (!d) continue;
      const diff = d.getTime() - now;
      if (diff > 0 && diff <= sevenDays) {
        const key = `${plant.id}:${stage}`;
        if (existingKeys.has(key)) continue;
        const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
        await createNotification(
          userId,
          `stage_${stage}`,
          `${STAGE_LABELS_TR[stage]} yaklaşıyor: ${plant.name}`,
          `${plant.name} için ${STAGE_LABELS_TR[stage].toLowerCase()} aşamasına ${daysLeft} gün kaldı.`,
          key
        );
      }
    }
  }
}
