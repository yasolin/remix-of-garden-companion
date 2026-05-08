import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { Bell, Droplets, Leaf, Calendar, Camera, Users, Wind, Thermometer, Sun, Sparkles, ChevronRight, Plus, LayoutGrid } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useWeather } from "@/hooks/useWeather";
import { getUnreadCount } from "@/lib/notificationService";
import { useQueryClient } from "@tanstack/react-query";
import logo from "@/assets/logo.png";
import heroPot from "@/assets/hero-pot.png";
import heroPlants from "@/assets/hero-plants.png";
import heroWatering from "@/assets/hero-watering.png";

interface Props {
  onToggleView: () => void;
}

const HomeMainView = ({ onToggleView }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { weather } = useWeather();
  const queryClient = useQueryClient();

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

  const userName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
  const needsWater = plants.filter((p) => p.needs_watering);
  const harvestReady = plants.filter((p) => (p.days_to_harvest ?? 30) <= 3);
  const taskCount = needsWater.length + harvestReady.length;

  const tipText = (() => {
    const temp = weather?.temp ?? 22;
    if (temp > 28) return t("mainView.tipHot");
    if (temp < 8) return t("mainView.tipCold");
    const code = weather?.weatherCode ?? 0;
    if ([51, 53, 55, 61, 63, 65, 80].includes(code)) return t("mainView.tipRain");
    return t("mainView.tipGood");
  })();

  const completeWater = async (id: string) => {
    await updatePlant(id, { needs_watering: false });
    queryClient.invalidateQueries({ queryKey: ["plants"] });
  };

  return (
    <div className="pb-24 max-w-lg mx-auto bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-0">
        <div className="flex-1">
          <img src={logo} alt="GardenPot" className="h-20 object-contain -ml-1" />
        </div>
        <button onClick={onToggleView} className="p-2 rounded-full hover:bg-secondary mr-1" title={t("mainView.toggle")}>
          <LayoutGrid className="w-5 h-5 text-muted-foreground" />
        </button>
        <button onClick={() => navigate("/notifications")} className="relative p-2 rounded-full hover:bg-secondary">
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          )}
        </button>
      </div>

      {/* Greeting + plants illustration */}
      <div className="px-4 mt-2 relative">
        <div className="relative z-10 max-w-[60%]">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {t("mainView.hello", { name: userName })} 🌱
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("mainView.subtitle")}</p>
        </div>
        <img
          src={heroPlants}
          alt=""
          className="absolute right-0 top-0 w-40 h-28 object-contain opacity-95"
        />
      </div>

      {/* Today's task hero card */}
      <div className="px-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-3xl p-4 border border-primary/15 relative overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{t("mainView.todayForPlants")}</p>
              <p className="text-2xl font-bold text-primary leading-tight">
                {t("mainView.tasksCount", { count: taskCount })}
              </p>

              <div className="space-y-1.5 mt-3">
                {needsWater.length > 0 && (
                  <div className="bg-card rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-foreground">
                      {t("mainView.needsWaterShort", { count: needsWater.length })}
                    </span>
                  </div>
                )}
                {harvestReady.length > 0 && (
                  <div className="bg-card rounded-full px-3 py-1.5 flex items-center gap-2 shadow-sm">
                    <Leaf className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-foreground">
                      {t("mainView.harvestReadyShort", { count: harvestReady.length })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <img src={heroPot} alt="" className="w-24 h-24 object-contain shrink-0 -mr-2" />
          </div>

          <button
            onClick={() => navigate("/tasks")}
            className="mt-4 w-full bg-primary text-primary-foreground rounded-full py-3 px-4 flex items-center justify-center gap-2 font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            {t("mainView.viewTasks")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>

      {/* Weather strip */}
      {weather && (
        <div className="px-4 mt-3">
          <div className="bg-card rounded-2xl border border-border px-3 py-3 flex items-center justify-around">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{weather.condition}</span>
              <div>
                <p className="text-base font-bold text-foreground leading-none">{weather.temp}°</p>
                <p className="text-[10px] text-muted-foreground">{t("home.weatherTemp")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-base font-bold text-foreground leading-none">{weather.wind}</p>
                <p className="text-[10px] text-muted-foreground">km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-cyan-500" />
              <div>
                <p className="text-base font-bold text-foreground leading-none">{weather.humidity}%</p>
                <p className="text-[10px] text-muted-foreground">{t("home.weatherHumidity")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[11px] font-semibold text-foreground leading-tight">↑{weather.sunrise}</p>
                <p className="text-[11px] font-semibold text-foreground leading-tight">↓{weather.sunset}</p>
              </div>
            </div>
          </div>
          {weather.city && (
            <p className="text-[11px] text-muted-foreground text-center mt-1">📍 {weather.city}</p>
          )}
        </div>
      )}

      {/* Quick actions */}
      <div className="px-4 mt-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">{t("mainView.quickActions")}</h3>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate("/add-plant")}
            className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border border-emerald-500/15 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            <span className="text-xs font-medium text-foreground text-center leading-tight">{t("mainView.addPlant")}</span>
          </button>
          <button
            onClick={() => navigate("/ai-assistant")}
            className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border border-blue-500/15 active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
            <span className="text-xs font-medium text-foreground text-center leading-tight">{t("mainView.identifyPlant")}</span>
          </button>
          <button
            onClick={() => navigate("/community")}
            className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-3 flex flex-col items-center justify-center gap-1.5 border border-purple-500/15 active:scale-95 transition-transform"
          >
            <Users className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
            <span className="text-xs font-medium text-foreground text-center leading-tight">{t("mainView.joinCommunity")}</span>
          </button>
        </div>
      </div>

      {/* Bitki Bakım Takvimi */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{t("mainView.careCalendar")}</h3>
          <button onClick={() => navigate("/tasks")} className="text-xs font-medium text-primary flex items-center gap-0.5">
            {t("mainView.viewAll")} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Sulama */}
          <button
            onClick={() => navigate("/watering")}
            className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-3 text-left border border-blue-500/15 active:scale-95 transition-transform relative"
          >
            <div className="flex items-start justify-between">
              <Droplets className="w-7 h-7 text-blue-500" strokeWidth={2} />
              <span className="bg-blue-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {needsWater.length}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground mt-2">{t("home.wateringTime")}</p>
            <p className="text-[11px] text-muted-foreground">{t("mainView.today")}</p>
            <p className="text-[11px] text-foreground/80 mt-0.5">
              {t("mainView.wateringSubtitle", { count: needsWater.length })}
            </p>
            <div className="mt-2 bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[11px] font-medium rounded-full py-1 text-center">
              {t("mainView.view")}
            </div>
          </button>

          {/* Hasat */}
          <button
            onClick={() => navigate("/harvest")}
            className="bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl p-3 text-left border border-emerald-500/15 active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between">
              <Leaf className="w-7 h-7 text-emerald-600" strokeWidth={2} />
              <span className="bg-emerald-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {harvestReady.length}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground mt-2">{t("home.harvestTime")}</p>
            <p className="text-[11px] text-muted-foreground">{t("mainView.today")}</p>
            <p className="text-[11px] text-foreground/80 mt-0.5">
              {t("mainView.harvestSubtitle", { count: harvestReady.length })}
            </p>
            <div className="mt-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium rounded-full py-1 text-center">
              {t("mainView.view")}
            </div>
          </button>

          {/* Ekim Takvimi */}
          <button
            onClick={() => navigate("/planting-calendar")}
            className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl p-3 text-left border border-amber-500/15 active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between">
              <Calendar className="w-7 h-7 text-amber-600" strokeWidth={2} />
              <span className="bg-amber-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                3
              </span>
            </div>
            <p className="text-sm font-bold text-foreground mt-2">{t("home.plantingSuggestion")}</p>
            <p className="text-[11px] text-muted-foreground">{t("mainView.thisWeek")}</p>
            <p className="text-[11px] text-foreground/80 mt-0.5">
              {t("mainView.plantingSubtitle", { count: 3 })}
            </p>
            <div className="mt-2 bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[11px] font-medium rounded-full py-1 text-center">
              {t("mainView.view")}
            </div>
          </button>

          {/* Bitki Analiz */}
          <button
            onClick={() => navigate("/ai-assistant")}
            className="bg-purple-50 dark:bg-purple-500/10 rounded-2xl p-3 text-left border border-purple-500/15 active:scale-95 transition-transform"
          >
            <div className="flex items-start justify-between">
              <Stethoscope className="w-7 h-7 text-purple-500" strokeWidth={2} />
              <span className="bg-purple-500 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center">
                {plants.length > 0 ? 1 : 0}
              </span>
            </div>
            <p className="text-sm font-bold text-foreground mt-2 leading-tight">{t("mainView.diagnosisTitle")}</p>
            <p className="text-[11px] text-foreground/80 mt-0.5">{t("mainView.diagnosisSubtitle")}</p>
            <div className="mt-2 bg-purple-500/15 text-purple-600 dark:text-purple-400 text-[11px] font-medium rounded-full py-1 text-center">
              {t("mainView.view")}
            </div>
          </button>
        </div>
      </div>

      {/* Bitkilerim */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{t("mainView.myPlants")}</h3>
          <button onClick={() => navigate("/my-plants")} className="text-xs font-medium text-primary flex items-center gap-0.5">
            {t("mainView.viewAll")} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        {plants.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 text-center text-xs text-muted-foreground">
            {t("mainView.noPlants")}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 snap-x">
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/plants/${p.id}`)}
                className="shrink-0 w-32 bg-card rounded-2xl border border-border overflow-hidden text-left snap-start active:scale-95 transition-transform"
              >
                <div className="w-full h-24 bg-muted flex items-center justify-center">
                  {p.photo_url ? (
                    <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🪴</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-primary">
                    {(p.stage as string) === "harvest"
                      ? t("mainView.harvestReady")
                      : (p as any).health_status || t("plant.healthy") || "Sağlıklı"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeMainView;
