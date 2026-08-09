import { getLifecycle, stageLabel, type LifecycleStage } from "./plantLifecycles";
import type { PlantRow } from "./plantService";

export interface StageProgress {
  stage: LifecycleStage;
  index: number;
  date: Date;
  daysLeft: number;
}

export interface PlantStageInfo {
  plantId: string;
  plantName: string;
  photoUrl?: string | null;
  current: StageProgress | null;
  next: StageProgress | null;
  upcoming: StageProgress[];
  totalStages: number;
  progressPct: number;
}

/**
 * Estimate a date for every lifecycle stage of a plant by spreading the
 * stages across the plant's harvest window (planted_date → days_to_harvest).
 * Stages after the harvest stage keep the same average spacing.
 */
export function getPlantStageInfo(plant: PlantRow, lang: string): PlantStageInfo | null {
  if (!plant.planted_date) return null;
  const stages = getLifecycle((plant as any).category).stages;
  if (!stages.length) return null;

  const planted = new Date(plant.planted_date).getTime();
  const dayMs = 86_400_000;
  const harvestDays = plant.days_to_harvest ?? 60;
  const harvestIdx = Math.max(1, stages.findIndex((s) => s.key === "harvest") >= 0
    ? stages.findIndex((s) => s.key === "harvest")
    : stages.length - 1);
  const stepDays = harvestDays / harvestIdx;

  const now = Date.now();
  const all: StageProgress[] = stages.map((stage, index) => {
    const date = new Date(planted + index * stepDays * dayMs);
    return {
      stage,
      index,
      date,
      daysLeft: Math.ceil((date.getTime() - now) / dayMs),
    };
  });

  const reached = all.filter((s) => s.daysLeft <= 0);
  const upcoming = all.filter((s) => s.daysLeft > 0);
  const current = reached.length ? reached[reached.length - 1] : null;
  const next = upcoming.length ? upcoming[0] : null;

  return {
    plantId: plant.id,
    plantName: plant.name,
    photoUrl: plant.photo_url,
    current,
    next,
    upcoming: upcoming.slice(0, 3),
    totalStages: stages.length,
    progressPct: Math.round(((current ? current.index + 1 : 0) / stages.length) * 100),
  };
}

export function labelOf(sp: StageProgress, lang: string) {
  return stageLabel(sp.stage, lang);
}

export function formatStageDate(d: Date, lang: string) {
  return d.toLocaleDateString(lang?.startsWith("tr") ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "short",
  });
}
