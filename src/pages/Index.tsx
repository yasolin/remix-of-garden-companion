import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Droplets, Sprout, Camera, Bell, CheckCircle2, Scissors, Leaf, Clock, Sun, Wind, Users, Thermometer, Umbrella } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useWeather } from "@/hooks/useWeather";
import { getUnreadCount } from "@/lib/notificationService";
import logo from "@/assets/logo.png";

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
  const [showHistory, setShowHistory] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>([]);
  const { weather } = useWeather();

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count", user?.id],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const harvestSoon = plants.filter(p => (p.days_to_harvest ?? 30) <= 7).length;
  const needsWater = plants.filter(p => p.needs_watering).length;
  const waterNames = plants.filter(p => p.needs_watering).map(p => p.name).join(", ");

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

  // Weather-based plant tips
  const weatherTips: string[] = [];
  if (weather) {
    const temp = weather.temp;
    const code = weather.weatherCode ?? 0;
    const isRainy = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code);
    const isHot = temp > 30;
    const isCold = temp < 5;

    if (isRainy && plants.some(p => p.placement?.includes("Balkon") || p.placement?.includes("balcony"))) {
      weatherTips.push(t("weatherTips.rainyBalcony"));
    }
    if (isHot) {
      weatherTips.push(t("weatherTips.hotSun"));
    }
    if (isCold) {
      weatherTips.push(t("weatherTips.coldProtect"));
    }
    if (!isRainy && !isHot && !isCold && plants.length > 0) {
      weatherTips.push(t("weatherTips.goodDay"));
    }
  }

  const mainCards = [
    {
      key: "harvest", route: "/harvest",
      gradient: "from-emerald-500/15 via-green-400/10 to-teal-500/15",
      border: "border-emerald-500/20",
      icon: Calendar, iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20", iconColor: "text-emerald-600",
      title: t("home.harvestTime"),
      desc: t("home.harvestReady", { count: harvestSoon }),
      badge: `📅 ${t("home.harvestPlants", { count: harvestSoon })}`,
      badgeColor: "bg-emerald-500/10 text-emerald-600",
    },
    {
      key: "water", route: "/watering",
      gradient: "from-blue-500/15 via-cyan-400/10 to-sky-500/15",
      border: "border-blue-500/20",
      icon: Droplets, iconBg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20", iconColor: "text-blue-500",
      title: t("home.wateringTime"),
      desc: needsWater > 0 ? t("home.needsWater", { names: waterNames }) : t("home.allWatered"),
      badge: `💧 ${t("home.today")}`,
      badgeColor: "bg-blue-500/10 text-blue-600",
    },
    {
      key: "calendar", route: "/planting-calendar",
      gradient: "from-amber-500/15 via-orange-400/10 to-yellow-500/15",
      border: "border-amber-500/20",
      icon: Sprout, iconBg: "bg-gradient-to-br from-amber-500/20 to-orange-500/20", iconColor: "text-amber-600",
      title: t("home.plantingSuggestion"),
      desc: t("home.plantingDesc"),
      badge: `🌱 ${t("home.thisWeek")}`,
      badgeColor: "bg-amber-500/10 text-amber-600",
    },
    {
      key: "ai", route: "/ai-assistant",
      gradient: "from-violet-500/15 via-purple-400/10 to-indigo-500/15",
      border: "border-violet-500/20",
      icon: Camera, iconBg: "bg-gradient-to-br from-violet-500/20 to-indigo-500/20", iconColor: "text-violet-500",
      title: t("home.plantAnalysis"),
      desc: t("home.plantAnalysisDesc"),
      badge: t("home.openAssistant"),
      badgeColor: "bg-violet-500/10 text-violet-600",
    },
    {
      key: "community", route: "/community",
      gradient: "from-pink-500/15 via-rose-400/10 to-fuchsia-500/15",
      border: "border-pink-500/20",
      icon: Users, iconBg: "bg-gradient-to-br from-pink-500/20 to-rose-500/20", iconColor: "text-pink-500",
      title: t("home.community"),
      desc: t("home.communityDesc"),
      badge: `🌍 ${t("home.communityJoin")}`,
      badgeColor: "bg-pink-500/10 text-pink-600",
    },
  ];

  return (
    <div className="pb-24 max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-0">
        <div className="flex-1">
          <img src={logo} alt="GardenPot" className="h-32 object-contain -ml-1" />
        </div>
        <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary rounded-full text-[9px] text-primary-foreground font-semibold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Greeting */}
      <div className="px-4 mt-1 mb-3">
        <h2 className="text-lg font-medium text-foreground">
          {t("home.greeting", { name: userName })} 🌱
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {weather?.city ? `📍 ${weather.city} • ` : ""}{t("home.growing", { count: plants.length })}
        </p>
      </div>

      {/* Weather Widgets */}
      {weather && (
        <div className="px-4 mb-3">
          <div className="grid grid-cols-4 gap-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-xl p-2.5 border border-amber-500/10 text-center">
              <div className="text-xl mb-0.5">{weather.condition}</div>
              <p className="text-base font-bold text-foreground">{weather.temp}°</p>
              <p className="text-[9px] text-muted-foreground">{t("home.weatherTemp")}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-xl p-2.5 border border-blue-500/10 text-center">
              <Wind className="w-4 h-4 text-blue-400 mx-auto mb-0.5" />
              <p className="text-base font-bold text-foreground">{weather.wind}</p>
              <p className="text-[9px] text-muted-foreground">km/h</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-teal-500/10 to-emerald-500/5 rounded-xl p-2.5 border border-teal-500/10 text-center">
              <Thermometer className="w-4 h-4 text-teal-500 mx-auto mb-0.5" />
              <p className="text-base font-bold text-foreground">{weather.humidity}%</p>
              <p className="text-[9px] text-muted-foreground">{t("home.weatherHumidity")}</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 rounded-xl p-2.5 border border-orange-500/10 text-center">
              <Sun className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
              <p className="text-[10px] font-semibold text-foreground">↑{weather.sunrise}</p>
              <p className="text-[10px] font-semibold text-foreground">↓{weather.sunset}</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Weather Tips */}
      {weatherTips.length > 0 && (
        <div className="px-4 mb-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 rounded-xl p-3 border border-amber-500/15">
            <div className="flex items-start gap-2">
              <Umbrella className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                {weatherTips.map((tip, i) => (
                  <p key={i} className="text-xs text-foreground">{tip}</p>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main cards */}
      <div className="px-4 space-y-3">
        {mainCards.map((card, i) => (
          <motion.div key={card.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05 }}
            onClick={() => navigate(card.route)}
            className={`bg-gradient-to-r ${card.gradient} rounded-2xl p-4 cursor-pointer border ${card.border} hover:shadow-md transition-all hover:scale-[1.01]`}>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} />
              </div>
              <h3 className="font-medium text-foreground text-sm">{card.title}</h3>
            </div>
            <p className="text-xs text-muted-foreground ml-[46px]">{card.desc}</p>
            <span className={`inline-flex items-center gap-1 mt-2 ml-[46px] ${card.badgeColor} text-[11px] font-medium px-2.5 py-0.5 rounded-full`}>
              {card.badge}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Today's Tasks */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate("/tasks")} className="font-medium text-foreground text-base hover:text-primary transition-colors">
            {t("home.todaysTasks")} →
          </button>
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
            {activeTasks.slice(0, 3).map(task => (
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
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleCompleteTask(task); }}
                  className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </button>
              </motion.div>
            ))}
            {activeTasks.length > 3 && (
              <button onClick={() => navigate("/tasks")}
                className="w-full text-center text-xs text-primary font-medium py-2">
                {t("tasks.viewAll", { count: activeTasks.length })}
              </button>
            )}
          </div>
        )}

        {showHistory && completedTasks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="mt-3">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("home.completedTasks")}</h4>
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
