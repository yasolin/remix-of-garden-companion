import { supabase } from "@/integrations/supabase/client";
import { createNotification } from "./notificationService";
import type { PlantRow } from "./plantService";

// Stage definitions with day offsets from planted_date
const STAGE_KEYS = ["germination", "flowering", "fruiting", "harvest"] as const;
type StageKey = typeof STAGE_KEYS[number];

const STAGE_LABELS_TR: Record<StageKey, string> = {
  germination: "Çimlenme",
  flowering: "Çiçeklenme",
  fruiting: "Meyve",
  harvest: "Hasat",
};

const STAGE_LABELS_EN: Record<StageKey, string> = {
  germination: "Germination",
  flowering: "Flowering",
  fruiting: "Fruiting",
  harvest: "Harvest",
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

// Buckets: notify once per stage at each threshold (7d, 3d, 1d, 0d=today)
const COUNTDOWN_BUCKETS = [7, 3, 1, 0] as const;

function bucketFor(daysLeft: number): number | null {
  if (daysLeft <= 0) return 0;
  if (daysLeft <= 1) return 1;
  if (daysLeft <= 3) return 3;
  if (daysLeft <= 7) return 7;
  return null;
}

/**
 * Check all user plants and create notifications for upcoming stages.
 * Creates separate notifications for 7/3/1/0 day thresholds — once each.
 */
export async function checkAndCreateStageNotifications(
  userId: string,
  plants: PlantRow[],
  lang: string = "tr"
) {
  if (!plants.length) return;
  const labels = lang === "tr" ? STAGE_LABELS_TR : STAGE_LABELS_EN;

  const { data: existing } = await supabase
    .from("notifications" as any)
    .select("related_id")
    .eq("user_id", userId)
    .in("type", [
      "stage_germination", "stage_flowering", "stage_fruiting", "stage_harvest",
      "watering_reminder",
    ]);

  const existingKeys = new Set((existing as any[] || []).map((n) => n.related_id));
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  for (const plant of plants) {
    // ---- Stage countdown notifications ----
    const dates = getStageDates(plant);
    for (const stage of STAGE_KEYS) {
      const d = dates[stage];
      if (!d) continue;
      const diff = d.getTime() - now;
      const daysLeft = Math.ceil(diff / dayMs);
      const bucket = bucketFor(daysLeft);
      if (bucket === null) continue;

      const key = `${plant.id}:${stage}:${bucket}`;
      if (existingKeys.has(key)) continue;

      let body: string;
      if (bucket === 0) {
        body = lang === "tr"
          ? `${plant.name}: ${labels[stage].toLowerCase()} aşaması bugün! 🎉`
          : `${plant.name}: ${labels[stage].toLowerCase()} stage today! 🎉`;
      } else {
        body = lang === "tr"
          ? `${plant.name} için ${labels[stage].toLowerCase()} aşamasına ${bucket === 1 ? "1 gün" : `${bucket} gün`} kaldı.`
          : `${bucket === 1 ? "1 day" : `${bucket} days`} left until ${labels[stage].toLowerCase()} for ${plant.name}.`;
      }

      await createNotification(
        userId,
        `stage_${stage}`,
        lang === "tr"
          ? `${labels[stage]} yaklaşıyor: ${plant.name}`
          : `${labels[stage]} approaching: ${plant.name}`,
        body,
        key
      );
    }

    // ---- Watering reminder notifications (next scheduled event due ≤ today) ----
    if (plant.id) {
      const { data: nextEvents } = await supabase
        .from("watering_events" as any)
        .select("id, scheduled_at, status")
        .eq("plant_id", plant.id)
        .eq("status", "scheduled")
        .order("scheduled_at", { ascending: true })
        .limit(1);
      const ev = (nextEvents as any[])?.[0];
      if (ev?.scheduled_at) {
        const due = new Date(ev.scheduled_at).getTime();
        const diff = due - now;
        const daysLeft = Math.ceil(diff / dayMs);
        if (daysLeft <= 1) {
          const key = `${plant.id}:water:${ev.id}`;
          if (!existingKeys.has(key)) {
            await createNotification(
              userId,
              "watering_reminder",
              lang === "tr" ? `💧 Sulama hatırlatması` : `💧 Watering reminder`,
              daysLeft <= 0
                ? (lang === "tr" ? `${plant.name} bugün sulanmalı.` : `${plant.name} needs water today.`)
                : (lang === "tr" ? `${plant.name} yarın sulanmalı.` : `${plant.name} needs water tomorrow.`),
              key
            );
          }
        }
      }
    }
  }
}
