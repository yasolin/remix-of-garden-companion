import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Bell, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants, type PlantRow } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const harvestSoon = plants.filter(p => (p.days_to_harvest ?? 30) <= 7).length;
  const needsWater = plants.filter(p => p.needs_watering).length;
  const waterNames = plants.filter(p => p.needs_watering).map(p => p.name).join(", ");

  // Today's tasks
  const tasks: { text: string; type: string }[] = [];
  plants.forEach(p => {
    if (p.needs_watering) tasks.push({ text: t("home.waterTask", { name: p.name }), type: "water" });
    if ((p.days_to_harvest ?? 30) <= 3) tasks.push({ text: t("home.harvestTask", { name: p.name }), type: "harvest" });
  });

  // Notifications
  const notifications: string[] = [];
  plants.forEach(p => {
    if (p.needs_watering) notifications.push(t("notifications.watering", { name: p.name }));
    if ((p.days_to_harvest ?? 30) <= 7) notifications.push(t("notifications.harvest", { name: p.name }));
  });

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Sprout className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1" />
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-secondary">
          <Bell className="w-5 h-5 text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-destructive-foreground font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications dropdown */}
      {showNotifications && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 bg-card rounded-2xl border border-border shadow-card p-4">
          <h3 className="font-bold text-sm text-foreground mb-2">{t("notifications.title")}</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("notifications.noNotifications")}</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <p key={i} className="text-sm text-foreground">{n}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Main cards */}
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
          onClick={() => navigate("/watering")}
          className="gradient-market rounded-2xl p-4 cursor-pointer min-h-[140px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">{t("home.wateringTime")}</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">
              {needsWater > 0 ? t("home.needsWater", { names: waterNames }) : t("home.allWatered")}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 bg-primary-foreground/20 text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              💧 {t("home.today")}
            </span>
          </div>
        </motion.div>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mt-3">
        <motion.div custom={2} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/planting-calendar")}
          className="gradient-planting rounded-2xl p-4 cursor-pointer min-h-[130px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-foreground font-bold text-base">{t("home.plantingSuggestion")}</h3>
            <span className="inline-flex items-center gap-1 mt-2 bg-accent text-accent-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
              🌿 {t("home.ideal")}
            </span>
          </div>
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="visible" variants={cardVariants}
          onClick={() => navigate("/location-analysis")}
          className="gradient-help rounded-2xl p-4 cursor-pointer min-h-[130px] flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-primary-foreground font-bold text-base">{t("home.locationAnalysis")}</h3>
            <p className="text-primary-foreground/80 text-xs mt-0.5">{t("home.locationDesc")}</p>
          </div>
        </motion.div>
      </div>

      {/* Today's Tasks */}
      <div className="px-4 mt-6">
        <h2 className="text-lg font-bold text-foreground mb-3">{t("home.todaysTasks")}</h2>
        {tasks.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 border border-border text-center">
            <p className="text-sm text-muted-foreground">{t("home.noTasks")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${task.type === "water" ? "text-primary" : "text-accent"}`} />
                <span className="text-sm font-semibold text-foreground">{task.text}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
