import { stages, stageLabels } from "@/data/mockData";
import { Check, Sprout, Leaf, Flower2, Apple, Scissors } from "lucide-react";

const stageIcons: Record<string, React.ElementType> = {
  planting: Sprout,
  germination: Leaf,
  flowering: Flower2,
  fruiting: Apple,
  harvest: Scissors,
};

interface GrowthTimelineProps {
  currentStage: string;
}

const GrowthTimeline = ({ currentStage }: GrowthTimelineProps) => {
  const currentIdx = stages.indexOf(currentStage as any);

  return (
    <div className="flex items-center gap-1 mt-3">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const Icon = stageIcons[stage];

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary text-primary-foreground animate-pulse-gentle ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span
                className={`text-[9px] mt-1 font-semibold text-center leading-tight ${
                  isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {stageLabels[stage]}
              </span>
            </div>
            {idx < stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-2 -mt-4 ${
                  idx < currentIdx ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GrowthTimeline;
