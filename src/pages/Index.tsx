import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserPlants, type PlantRow } from "@/lib/plantService";
import { myPlants as mockPlants, seasonalSuggestions } from "@/data/mockData";
import { useEffect, useState } from "react";

const Index = () => {
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

  // Use DB plants if logged in, otherwise mock
  const plants = userId && dbPlants ? dbPlants : [];
  const allPlants = plants.length > 0 ? plants : mockPlants.map(p => ({
    ...p, current_stage: ["planting","germination","flowering","fruiting","harvest"].indexOf(p.currentStage),
    days_to_harvest: p.daysToHarvest, needs_watering: p.needsWatering, photo_url: p.photo,
    water_frequency: p.waterFrequency, wind_sensitivity: p.windSensitivity,
    scientific_name: p.scientificName, soil_type: p.soilType, planted_date: p.plantedDate,
    user_id: "", created_at: "", updated_at: "",
  })) as any[];

  const harvestSoon = allPlants.filter((p: any) => (p.days_to_harvest ?? p.daysToHarvest ?? 30) <= 7).length;
  const needsWater = allPlants.filter((p: any) => p.needs_watering ?? p.needsWatering).length;
  const waterNames = allPlants.filter((p: any) => p.needs_watering ?? p.needsWatering).map((p: any) => p.name).join(", ");

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sprout className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1 bg-secondary rounded-full px-4 py-2.5 flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{t("home.search")}</span>
        </div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mt-2">
        <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/harvest")}
          className="gradient-harvest rounded-2xl p-4 cursor-pointer min-h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">{t("home.harvestTime")}</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">{t("home.harvestReady", { count: harvestSoon })}</p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              📅 {t("home.harvestPlants", { count: harvestSoon })}
            </span>
          </div>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/my-plants")}
          className="gradient-market rounded-2xl p-4 cursor-pointer min-h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">{t("home.myPlants")}</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">{t("home.growing", { count: allPlants.length })}</p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              🌱 {t("home.discover")}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mt-3">
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}
          className="gradient-watering rounded-2xl p-4 min-h-[130px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-base">{t("home.wateringTime")}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              {needsWater > 0 ? t("home.needsWater", { names: waterNames }) : t("home.allWatered")}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              💧 {t("home.today")}
            </span>
          </div>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}
          className="gradient-planting rounded-2xl p-4 min-h-[130px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-base">{t("home.plantingSuggestion")}</h3>
            <p className="text-muted-foreground text-xs mt-0.5">{t("home.plantingTime", { name: seasonalSuggestions[0].name })}</p>
            <span className="inline-flex items-center gap-1 mt-2 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              🌿 {t("home.ideal")}
            </span>
          </div>
        </motion.div>
      </div>

      <motion.div custom={4} initial="hidden" animate="visible" variants={cardVariants}
        onClick={() => navigate("/ai-assistant")}
        className="mx-4 mt-3 gradient-help rounded-2xl p-5 cursor-pointer flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
          <Camera className="w-6 h-6 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="text-primary-foreground font-bold text-base">{t("home.needHelp")}</h3>
          <p className="text-primary-foreground/80 text-sm mt-0.5">{t("home.helpDesc")}</p>
        </div>
      </motion.div>

      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">{t("home.seasonTitle")}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {seasonalSuggestions.map((s) => (
            <div key={s.name} className="min-w-[120px] bg-card rounded-xl p-3 shadow-card border border-border flex flex-col items-center gap-1">
              <span className="text-3xl">{s.emoji}</span>
              <span className="font-bold text-sm text-foreground">{s.name}</span>
              <span className="text-[10px] text-muted-foreground text-center">{s.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
