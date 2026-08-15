import { ArrowLeft, Plus, Sun, Droplets, Wind, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchUserPlants } from "@/lib/plantService";
import { getLifecycleForPlant, categoryLabel } from "@/lib/plantLifecycles";

const MyPlantsPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("plants.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("plants.subtitle", { count: plants.length })}</p>
          </div>
        </div>
        <button onClick={() => navigate("/add-plant")} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
          <Plus className="w-5 h-5 text-primary-foreground" />
        </button>
      </div>

      {plants.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <Leaf className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">{t("plants.noPlants")}</p>
          <button onClick={() => navigate("/add-plant")} className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-sm">
            {t("plants.addFirst")}
          </button>
        </div>
      ) : (
        <div className="px-4 mt-4 grid grid-cols-2 gap-3">
          {plants.map((plant, i) => {
            const lifecycle = getLifecycleForPlant(plant as any);
            const className = categoryLabel(lifecycle, i18n.language);
            const daysToHarvest = plant.days_to_harvest ?? 30;
            return (
              <motion.div key={plant.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }} onClick={() => navigate(`/plant/${plant.id}`)}
                className="bg-card rounded-2xl overflow-hidden shadow-card border border-border cursor-pointer relative">
                {plant.photo_url ? (
                  <img src={plant.photo_url} alt={plant.name} className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-secondary flex items-center justify-center">
                    <Leaf className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-3">
                  <h3 className="font-bold text-sm text-foreground">{plant.name}</h3>
                  <p className="text-[10px] text-muted-foreground italic">{plant.scientific_name}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {lifecycle.emoji} {className}
                  </span>
                  <div className="flex gap-2 mt-2">
                    <Sun className="w-3.5 h-3.5 text-accent" />
                    <Droplets className="w-3.5 h-3.5 text-primary" />
                    <Wind className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  {plant.placement && (
                    <p className="text-[10px] text-muted-foreground mt-1.5">📍 {plant.placement}</p>
                  )}
                </div>
                {daysToHarvest <= 7 && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t("plants.daysLeft", { count: daysToHarvest })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyPlantsPage;
