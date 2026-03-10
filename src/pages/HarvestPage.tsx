import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { myPlants } from "@/data/mockData";
import GrowthTimeline from "@/components/GrowthTimeline";

const HarvestPage = () => {
  const navigate = useNavigate();
  const sorted = [...myPlants].sort((a, b) => a.daysToHarvest - b.daysToHarvest);

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Hasat Zamanı</h1>
          <p className="text-sm text-muted-foreground">{sorted.length} bitki yetiştiriyorsunuz</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {sorted.map((plant, i) => (
          <motion.div
            key={plant.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-card rounded-2xl p-4 shadow-card border border-border"
          >
            <div className="flex items-center gap-3">
              <img
                src={plant.photo}
                alt={plant.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{plant.name}</h3>
                <p className="text-xs text-muted-foreground">{plant.scientificName}</p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  plant.daysToHarvest <= 3
                    ? "bg-primary text-primary-foreground"
                    : plant.daysToHarvest <= 7
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {plant.daysToHarvest} gün
              </span>
            </div>
            <GrowthTimeline currentStage={plant.currentStage} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HarvestPage;
