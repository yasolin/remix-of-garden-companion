import { stages } from "@/lib/plantService";
import { Sprout, Flower2, Apple, Scissors, Shovel } from "lucide-react";
import { useTranslation } from "react-i18next";

const stageIcons: Record<string, React.ElementType> = {
  planting: Shovel,
  germination: Sprout,
  flowering: Flower2,
  fruiting: Apple,
  harvest: Scissors,
};

const stageColors: Record<string, { active: string; completed: string }> = {
  planting: { active: "text-amber-600 bg-amber-500/10 ring-amber-500/30", completed: "text-amber-600 bg-amber-500/15" },
  germination: { active: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/30", completed: "text-emerald-600 bg-emerald-500/15" },
  flowering: { active: "text-pink-500 bg-pink-500/10 ring-pink-500/30", completed: "text-pink-500 bg-pink-500/15" },
  fruiting: { active: "text-orange-500 bg-orange-500/10 ring-orange-500/30", completed: "text-orange-500 bg-orange-500/15" },
  harvest: { active: "text-primary bg-primary/10 ring-primary/30", completed: "text-primary bg-primary/15" },
};

interface GrowthTimelineProps {
  currentStage: number | string;
  hasFruit?: boolean;
}

const GrowthTimeline = ({ currentStage, hasFruit = true }: GrowthTimelineProps) => {
  const { t } = useTranslation();

  const filteredStages = hasFruit
    ? stages
    : stages.filter(s => s !== "fruiting");

  const currentIdx = typeof currentStage === "number"
    ? currentStage
    : filteredStages.indexOf(currentStage as any);

  const stageLabels: Record<string, string> = {
    planting: t("stages.planting"),
    germination: t("stages.germination"),
    flowering: t("stages.flowering"),
    fruiting: t("stages.fruiting"),
    harvest: t("stages.harvest"),
  };

  return (
    <div className="flex items-center gap-0.5 mt-3">
      {filteredStages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon = stageIcons[stage];
        const colors = stageColors[stage];

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                isCompleted ? colors.completed
                  : isCurrent ? `${colors.active} ring-2`
                  : "bg-muted/60 text-muted-foreground/40"
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[8px] mt-1 font-medium text-center leading-tight ${
                isCurrent ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
              }`}>{stageLabels[stage]}</span>
            </div>
            {idx < filteredStages.length - 1 && (
              <div className={`h-[2px] flex-1 min-w-1.5 -mt-3 rounded-full ${
                idx < currentIdx ? "bg-primary/60" : "bg-muted/80"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GrowthTimeline;
