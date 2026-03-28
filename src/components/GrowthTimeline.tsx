import { stages } from "@/lib/plantService";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import stagePlanting from "@/assets/stage-planting.png";
import stageGermination from "@/assets/stage-germination.png";
import stageFlowering from "@/assets/stage-flowering.png";
import stageFruiting from "@/assets/stage-fruiting.png";
import stageHarvest from "@/assets/stage-harvest.png";

const stageImages: Record<string, string> = {
  planting: stagePlanting,
  germination: stageGermination,
  flowering: stageFlowering,
  fruiting: stageFruiting,
  harvest: stageHarvest,
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
    <div className="flex items-center gap-1 mt-3">
      {filteredStages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isCompleted ? "bg-primary/10 ring-2 ring-primary"
                  : isCurrent ? "bg-primary/10 ring-2 ring-primary animate-pulse-gentle"
                  : "bg-muted"
              }`}>
                {isCompleted ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <img src={stageImages[stage]} alt={stageLabels[stage]} className="w-7 h-7 object-contain" />
                )}
              </div>
              <span className={`text-[9px] mt-1 font-semibold text-center leading-tight ${
                isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
              }`}>{stageLabels[stage]}</span>
            </div>
            {idx < filteredStages.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-2 -mt-4 ${idx < currentIdx ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GrowthTimeline;
