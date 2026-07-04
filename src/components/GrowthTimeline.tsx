import { stages, stageEmojis, normalizeStageKey } from "@/lib/plantService";
import { useTranslation } from "react-i18next";

const stageColorsList = [
  { active: "text-amber-600 bg-amber-500/10 ring-amber-500/30", completed: "text-amber-600 bg-amber-500/15" },
  { active: "text-emerald-600 bg-emerald-500/10 ring-emerald-500/30", completed: "text-emerald-600 bg-emerald-500/15" },
  { active: "text-green-600 bg-green-500/10 ring-green-500/30", completed: "text-green-600 bg-green-500/15" },
  { active: "text-pink-400 bg-pink-500/10 ring-pink-500/30", completed: "text-pink-400 bg-pink-500/15" },
  { active: "text-pink-500 bg-pink-500/10 ring-pink-500/30", completed: "text-pink-500 bg-pink-500/15" },
  { active: "text-yellow-500 bg-yellow-500/10 ring-yellow-500/30", completed: "text-yellow-500 bg-yellow-500/15" },
  { active: "text-red-500 bg-red-500/10 ring-red-500/30", completed: "text-red-500 bg-red-500/15" },
  { active: "text-orange-500 bg-orange-500/10 ring-orange-500/30", completed: "text-orange-500 bg-orange-500/15" },
  { active: "text-primary bg-primary/10 ring-primary/30", completed: "text-primary bg-primary/15" },
  { active: "text-lime-600 bg-lime-500/10 ring-lime-500/30", completed: "text-lime-600 bg-lime-500/15" },
  { active: "text-slate-500 bg-slate-500/10 ring-slate-500/30", completed: "text-slate-500 bg-slate-500/15" },
];

interface GrowthTimelineProps {
  currentStage: number | string;
  hasFruit?: boolean;
}

// Stages hidden when the plant does not produce fruit/harvest (e.g. house plants)
const NON_FRUIT_HIDDEN = new Set(["producing", "ripening", "harvestReady"]);

const GrowthTimeline = ({ currentStage, hasFruit = true }: GrowthTimelineProps) => {
  const { t } = useTranslation();

  const filteredStages = (hasFruit ? stages : stages.filter(s => !NON_FRUIT_HIDDEN.has(s))) as readonly string[];

  const currentIdx = typeof currentStage === "number"
    ? Math.min(currentStage, filteredStages.length - 1)
    : Math.max(0, filteredStages.indexOf(normalizeStageKey(currentStage)));

  return (
    <div className="flex items-center gap-0.5 mt-3 overflow-x-auto">
      {filteredStages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const colors = stageColorsList[idx % stageColorsList.length];
        return (
          <div key={stage} className="flex items-center shrink-0" style={{ minWidth: 44 }}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all text-base ${
                isCompleted ? colors.completed : isCurrent ? `${colors.active} ring-2` : "bg-muted/60 opacity-40"
              }`}>
                <span>{stageEmojis[stage]}</span>
              </div>
              <span className={`text-[8px] mt-1 font-medium text-center leading-tight max-w-[50px] ${
                isCurrent ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/50"
              }`}>{t(`stages.${stage}`)}</span>
            </div>
            {idx < filteredStages.length - 1 && (
              <div className={`h-[2px] w-3 -mt-3 rounded-full ${idx < currentIdx ? "bg-primary/60" : "bg-muted/80"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GrowthTimeline;
