import { ArrowLeft, Droplets, Check, Undo2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const WateringPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recentlyWatered, setRecentlyWatered] = useState<string[]>([]);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const wateringPlants = plants.filter(p => p.needs_watering && !recentlyWatered.includes(p.id));
  const wateredPlants = [
    ...plants.filter(p => recentlyWatered.includes(p.id)),
    ...plants.filter(p => !p.needs_watering && !recentlyWatered.includes(p.id)),
  ];

  const handleWater = async (id: string) => {
    try {
      await updatePlant(id, { needs_watering: false });
      setRecentlyWatered(prev => [...prev, id]);
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "💧", description: t("watering.watered") });
    } catch (e: any) {
      toast({ title: "❌", description: e.message, variant: "destructive" });
    }
  };

  const handleUndo = async (id: string) => {
    try {
      await updatePlant(id, { needs_watering: true });
      setRecentlyWatered(prev => prev.filter(pid => pid !== id));
      queryClient.invalidateQueries({ queryKey: ["plants"] });
      toast({ title: "↩️", description: t("watering.undone") });
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
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{t("watering.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("watering.subtitle", { count: wateringPlants.length })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <Droplets className="w-5 h-5 text-blue-500" />
        </div>
      </div>

      {wateringPlants.length === 0 && wateredPlants.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Droplets className="w-10 h-10 text-primary/40" />
          </div>
          <p className="text-muted-foreground font-medium">{t("watering.allDone")}</p>
        </div>
      ) : (
        <>
          {wateringPlants.length > 0 && (
            <div className="px-4 mt-4 space-y-2">
              <AnimatePresence>
                {wateringPlants.map((plant, i) => (
                  <motion.div key={plant.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-2xl p-4 border border-border flex items-center gap-3">
                    {plant.photo_url ? (
                      <img src={plant.photo_url} alt={plant.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Droplets className="w-5 h-5 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-foreground">{plant.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{plant.water_frequency || t("watering.needsWater")}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleWater(plant.id)}
                      className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                      <Check className="w-5 h-5 text-white" />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {wateredPlants.length > 0 && (
            <div className="px-4 mt-5">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("watering.alreadyWatered")}</h3>
              <div className="space-y-1.5">
                {wateredPlants.map(plant => (
                  <div key={plant.id} className="bg-card/60 rounded-xl p-3 border border-border/40 flex items-center gap-3">
                    {plant.photo_url ? (
                      <img src={plant.photo_url} alt={plant.name} className="w-9 h-9 rounded-lg object-cover opacity-60" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center opacity-60">
                        <Droplets className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-sm text-muted-foreground flex-1">{plant.name}</span>
                    <Check className="w-4 h-4 text-primary" />
                    {recentlyWatered.includes(plant.id) && (
                      <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleUndo(plant.id)}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                        <Undo2 className="w-4 h-4 text-muted-foreground" />
                      </motion.button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WateringPage;
