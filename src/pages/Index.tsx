import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Bell, CheckCircle2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants, type PlantRow } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import logo from "@/assets/logo.jpeg";

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

  // Today's tasks - include watering tasks too
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

  return (
    <div className="pb-24 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <img src={logo} alt="Garden Pot" className="h-10 object-contain" />
        <div className="flex-1" />
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-lg hover:bg-secondary">
          <Bell className="w-5 h-5 text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-destructive-foreground font-bold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
        <button onClick={() => navigate("/profile")} className="p-2 rounded-lg hover:bg-secondary">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Greeting */}
      <div className="px-4 mt-1 mb-4">
        <h2 className="text-xl font-bold text-foreground">
          {t("home.greeting")} 🌿
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("home.growing", { count: plants.length })}
        </p>
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

      {/* Main cards - vertical stack like reference */}
      <div className="px-4 space-y-3">
        {/* Harvest Time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => navigate("/harvest")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-4" style={{ background: "hsl(142 40% 94%)" }}>
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t("home.harvestTime")}</h3>
            <p className="text-xs text-muted-foreground">{t("home.harvestReady", { count: harvestSoon })}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 bg-primary/10 text-primary text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              📅 {t("home.harvestPlants", { count: harvestSoon })}
            </span>
          </div>
        </motion.div>

        {/* Watering Time */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => navigate("/watering")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-4" style={{ background: "hsl(200 60% 94%)" }}>
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t("home.wateringTime")}</h3>
            <p className="text-xs text-muted-foreground">
              {needsWater > 0 ? t("home.needsWater", { names: waterNames }) : t("home.allWatered")}
            </p>
            <span className="inline-flex items-center gap-1 mt-1.5 bg-blue-500/10 text-blue-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              💧 {t("home.today")}
            </span>
          </div>
        </motion.div>

        {/* Planting Suggestions */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => navigate("/planting-calendar")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-4" style={{ background: "hsl(35 70% 93%)" }}>
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center">
            <Sprout className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t("home.plantingSuggestion")}</h3>
            <p className="text-xs text-muted-foreground">{t("home.plantingDesc")}</p>
            <div className="flex gap-1.5 mt-1.5">
              <span className="bg-accent/15 text-accent text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {t("home.thisWeek")}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Plant Analysis & AI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => navigate("/ai-assistant")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-4" style={{ background: "hsl(220 20% 94%)" }}>
          <div className="w-11 h-11 rounded-xl bg-muted-foreground/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">{t("home.plantAnalysis")}</h3>
            <p className="text-xs text-muted-foreground">{t("home.plantAnalysisDesc")}</p>
            <span className="inline-flex items-center gap-1 mt-1.5 bg-muted text-muted-foreground text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              {t("home.openAssistant")}
            </span>
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
