import { ArrowLeft, Droplets, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const WateringPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const wateringPlants = plants.filter(p => p.needs_watering);
  const wateredPlants = plants.filter(p => !p.needs_watering);

  const handleWater = async (id: string) => {
    try {
      await updatePlant(id, { needs_watering: false });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "💧", description: t("watering.watered") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t("watering.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("watering.subtitle", { count: wateringPlants.length })}</p>
        </div>
      </div>

      {wateringPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <Droplets className="w-16 h-16 text-primary/30" />
          <p className="text-muted-foreground">{t("watering.allDone")}</p>
        </div>
      ) : (
        <div className="px-4 mt-4 space-y-3">
          {wateringPlants.map((plant, i) => (
            <motion.div key={plant.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl p-4 shadow-card border border-border flex items-center gap-3">
              {plant.photo_url ? (
                <img src={plant.photo_url} alt={plant.name} className="w-14 h-14 rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-bold text-foreground">{plant.name}</h3>
                <p className="text-xs text-muted-foreground">{plant.water_frequency}</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleWater(plant.id)}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-5 h-5 text-primary-foreground" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {wateredPlants.length > 0 && (
        <div className="px-4 mt-6">
          <h3 className="text-sm font-bold text-muted-foreground mb-3">{t("watering.alreadyWatered")}</h3>
          <div className="space-y-2">
            {wateredPlants.map(plant => (
              <div key={plant.id} className="bg-card/50 rounded-xl p-3 border border-border/50 flex items-center gap-3 opacity-60">
                {plant.photo_url ? (
                  <img src={plant.photo_url} alt={plant.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Droplets className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-semibold text-foreground">{plant.name}</span>
                <Check className="w-4 h-4 text-primary ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WateringPage;
