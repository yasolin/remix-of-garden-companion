import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Bell, User, CheckCircle2, Scissors, Leaf, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import logo from "@/assets/logo.png";
import harvestImg from "@/assets/harvest-plants.png";
import wateringImg from "@/assets/watering-plants.png";
import plantingImg from "@/assets/planting-suggestion.png";
import analysisImg from "@/assets/plant-analysis.png";

interface TaskItem {
  id: string;
  type: "water" | "harvest" | "prune" | "soil";
  name: string;
  icon: React.ElementType;
  color: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>([]);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const harvestSoon = plants.filter(p => (p.days_to_harvest ?? 30) <= 7).length;
  const needsWater = plants.filter(p => p.needs_watering).length;
  const waterNames = plants.filter(p => p.needs_watering).map(p => p.name).join(", ");

  // Build today's tasks: watering + harvest + pruning + soil refresh
  const todayTasks: TaskItem[] = [
    ...plants.filter(p => p.needs_watering).map(p => ({
      id: `water-${p.id}`, type: "water" as const, name: p.name,
      icon: Droplets, color: "bg-blue-500/10 text-blue-500",
    })),
    ...plants.filter(p => (p.days_to_harvest ?? 30) <= 3).map(p => ({
      id: `harvest-${p.id}`, type: "harvest" as const, name: p.name,
      icon: Scissors, color: "bg-primary/10 text-primary",
    })),
    ...plants.filter(p => {
      if (!p.planted_date) return false;
      const daysSincePlanted = Math.floor((Date.now() - new Date(p.planted_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSincePlanted > 0 && daysSincePlanted % 30 === 0;
    }).map(p => ({
      id: `soil-${p.id}`, type: "soil" as const, name: p.name,
      icon: Leaf, color: "bg-amber-500/10 text-amber-600",
    })),
  ];

  // Monthly planting notifications
  const currentMonth = new Date().getMonth();
  const monthlyNotifications: string[] = [];
  const monthPlants: Record<number, string[]> = {
    0: ["Sarımsak", "Ispanak"], 1: ["Bezelye", "Marul"], 2: ["Havuç", "Turp", "Maydanoz"],
    3: ["Domates", "Biber", "Patlıcan"], 4: ["Kabak", "Salatalık", "Fasulye"],
    5: ["Karpuz", "Kavun", "Fesleğen"], 6: ["Tere", "Roka"], 7: ["Brokoli", "Karnabahar"],
    8: ["Lahana", "Ispanak"], 9: ["Sarımsak", "Soğan"], 10: ["Bezelye", "Bakla"], 11: ["Sarımsak", "Ispanak"],
  };
  (monthPlants[currentMonth] || []).forEach(name => {
    monthlyNotifications.push(t("notifications.planting", { name }));
  });

  const notifications: string[] = [...monthlyNotifications];
  plants.forEach(p => {
    if (p.needs_watering) notifications.push(t("notifications.watering", { name: p.name }));
    if ((p.days_to_harvest ?? 30) <= 7) notifications.push(t("notifications.harvest", { name: p.name }));
  });

  const userName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  const handleCompleteTask = async (task: TaskItem) => {
    if (task.type === "water") {
      const plantId = task.id.replace("water-", "");
      await updatePlant(plantId, { needs_watering: false });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
    }
    setCompletedTasks(prev => [...prev, task]);
  };

  const activeTasks = todayTasks.filter(t => !completedTasks.some(c => c.id === t.id));

  return (
    <div className="pb-24 max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center px-4 pt-5 pb-1">
        <div className="flex items-center flex-1">
          <img src={logo} alt="GardenPot" className="h-28 object-contain" />
        </div>
        <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5 text-foreground" />
          {notifications.length > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground font-semibold flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>
        <button onClick={() => navigate("/profile")} className="p-2 rounded-full hover:bg-secondary">
          <User className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Greeting */}
      <div className="px-4 mt-3 mb-5">
        <h2 className="text-xl font-semibold text-foreground">
          {t("home.greeting", { name: userName })} 🌱
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("home.growing", { count: plants.length })}
        </p>
      </div>

      {/* Notifications dropdown */}
      {showNotifications && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-4 bg-card rounded-2xl border border-border shadow-card p-4">
          <h3 className="font-semibold text-sm text-foreground mb-2">{t("notifications.title")}</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("notifications.noNotifications")}</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {notifications.map((n, i) => (
                <p key={i} className="text-sm text-foreground">{n}</p>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Main cards */}
      <div className="px-4 space-y-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          onClick={() => navigate("/harvest")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-3 overflow-hidden"
          style={{ background: "hsl(142 40% 94%)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-[15px]">{t("home.harvestTime")}</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-10">{t("home.harvestReady", { count: harvestSoon })}</p>
            <span className="inline-flex items-center gap-1 mt-2 ml-10 bg-primary/10 text-primary text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              📅 {t("home.harvestPlants", { count: harvestSoon })}
            </span>
          </div>
          <img src={harvestImg} alt="" className="w-20 h-20 object-contain shrink-0" loading="lazy" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => navigate("/watering")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-3 overflow-hidden"
          style={{ background: "hsl(200 60% 94%)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground text-[15px]">{t("home.wateringTime")}</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-10">
              {needsWater > 0 ? t("home.needsWater", { names: waterNames }) : t("home.allWatered")}
            </p>
            <span className="inline-flex items-center gap-1 mt-2 ml-10 bg-blue-500/10 text-blue-600 text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              💧 {t("home.today")}
            </span>
          </div>
          <img src={wateringImg} alt="" className="w-20 h-20 object-contain shrink-0" loading="lazy" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          onClick={() => navigate("/planting-calendar")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-3 overflow-hidden"
          style={{ background: "hsl(35 70% 93%)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-[15px]">{t("home.plantingSuggestion")}</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-10">{t("home.plantingDesc")}</p>
            <div className="flex gap-1.5 mt-2 ml-10">
              <span className="bg-accent/15 text-accent text-[11px] font-medium px-2.5 py-0.5 rounded-full">
                {t("home.thisWeek")}
              </span>
            </div>
          </div>
          <img src={plantingImg} alt="" className="w-20 h-20 object-contain shrink-0" loading="lazy" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          onClick={() => navigate("/ai-assistant")}
          className="rounded-2xl p-4 cursor-pointer flex items-center gap-3 overflow-hidden"
          style={{ background: "hsl(220 20% 94%)" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-muted-foreground/10 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground text-[15px]">{t("home.plantAnalysis")}</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-10">{t("home.plantAnalysisDesc")}</p>
            <span className="inline-flex items-center gap-1 mt-2 ml-10 bg-muted text-muted-foreground text-[11px] font-medium px-2.5 py-0.5 rounded-full">
              {t("home.openAssistant")}
            </span>
          </div>
          <img src={analysisImg} alt="" className="w-20 h-20 object-contain shrink-0" loading="lazy" />
        </motion.div>
      </div>

      {/* Today's Tasks */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground text-base">{t("home.todaysTasks")}</h3>
          {completedTasks.length > 0 && (
            <button onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-xs text-primary font-medium">
              <Clock className="w-3.5 h-3.5" /> {t("home.taskHistory")}
            </button>
          )}
        </div>

        {activeTasks.length === 0 ? (
          <div className="bg-card rounded-2xl p-4 border border-border text-center">
            <p className="text-sm text-muted-foreground">{t("home.noTasks")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeTasks.map(task => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${task.color}`}>
                  <task.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{task.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {task.type === "water" && t("home.waterTask", { name: task.name })}
                    {task.type === "harvest" && t("home.harvestTask", { name: task.name })}
                    {task.type === "soil" && t("home.soilTask", { name: task.name })}
                    {task.type === "prune" && t("home.pruneTask", { name: task.name })}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Task History */}
        {showHistory && completedTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{t("home.completedTasks")}</h4>
            <div className="space-y-1.5">
              {completedTasks.map(task => (
                <div key={task.id} className="bg-card/50 rounded-lg p-2.5 border border-border/40 flex items-center gap-2 opacity-60">
                  <task.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground flex-1">{task.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Index;
