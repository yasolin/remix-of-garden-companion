import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPlants, stageFromIndex } from "@/lib/plantService";
import { myPlants as mockPlants } from "@/data/mockData";
import GrowthTimeline from "@/components/GrowthTimeline";
import { useEffect, useState } from "react";

const HarvestPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id || null));
  }, []);

  const { data: dbPlants } = useQuery({
    queryKey: ["plants", userId],
    queryFn: () => fetchUserPlants(userId!),
    enabled: !!userId,
  });

  const plants = userId && dbPlants && dbPlants.length > 0
    ? [...dbPlants].sort((a, b) => (a.days_to_harvest ?? 30) - (b.days_to_harvest ?? 30))
    : [...mockPlants].sort((a, b) => a.daysToHarvest - b.daysToHarvest);

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("harvest.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("harvest.subtitle", { count: plants.length })}</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-3">
        {plants.map((plant: any, i) => {
          const daysToHarvest = plant.days_to_harvest ?? plant.daysToHarvest ?? 30;
          const photo = plant.photo_url || plant.photo;
          const name = plant.name;
          const scientificName = plant.scientific_name ?? plant.scientificName ?? "";
          const currentStage = plant.current_stage ?? plant.currentStage ?? 0;

          return (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <div className="flex items-center gap-3">
                {photo && <img src={photo} alt={name} className="w-14 h-14 rounded-xl object-cover" />}
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{name}</h3>
                  <p className="text-xs text-muted-foreground">{scientificName}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  daysToHarvest <= 3 ? "bg-primary text-primary-foreground"
                    : daysToHarvest <= 7 ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}>{t("harvest.days", { count: daysToHarvest })}</span>
              </div>
              <GrowthTimeline currentStage={currentStage} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default HarvestPage;
