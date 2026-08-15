import { ArrowLeft, CheckCircle2, Undo2, Clock, Droplets, Scissors, Leaf, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { fetchUserWateringEvents, completeWateringEvent, uncompleteWateringEvent } from "@/lib/wateringService";
import { fetchNotifications, markAsRead, markAsUnread } from "@/lib/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

type TaskSource = "plant" | "event" | "notification";

interface TaskItem {
  id: string;
  type: "water" | "harvest" | "prune" | "soil";
  name: string;
  desc?: string;
  source: TaskSource;
  refId: string;
  icon: React.ElementType;
  color: string;
}

const iconFor = (type: string) =>
  type === "water" ? Droplets : type === "harvest" ? Scissors : Leaf;
const colorFor = (type: string) =>
  type === "water"
    ? "bg-blue-500/10 text-blue-500"
    : type === "harvest"
    ? "bg-primary/10 text-primary"
    : "bg-amber-500/10 text-amber-600";

const TasksPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [completedTasks, setCompletedTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem("gardenPotCompletedTasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((task: any) => ({
          ...task,
          source: task.source || "plant",
          refId: task.refId || task.id,
          icon: iconFor(task.type),
          color: colorFor(task.type),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

  const { data: wateringEvents = [] } = useQuery({
    queryKey: ["watering-events", user?.id],
    queryFn: () => fetchUserWateringEvents(user!.id),
    enabled: !!user,
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => fetchNotifications(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  });

  const plantName = (id?: string | null) => plants.find((p) => p.id === id)?.name || "";

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // 1) Scheduled watering events that are due today or overdue
  const wateringTasks: TaskItem[] = wateringEvents
    .filter((e) => e.status === "scheduled" && new Date(e.scheduled_at) <= endOfToday)
    .map((e) => ({
      id: `event-${e.id}`,
      type: "water" as const,
      name: plantName(e.plant_id) || t("home.wateringTime"),
      desc: new Date(e.scheduled_at).toLocaleDateString(),
      source: "event" as const,
      refId: e.id,
      icon: Droplets,
      color: colorFor("water"),
    }));

  // 2) Tasks coming from notifications (watering reminders, harvest & stage alerts)
  const notificationTasks: TaskItem[] = notifications
    .filter((n) => {
      if (n.is_read) return false;
      return (
        n.type === "watering" ||
        n.type === "watering_reminder" ||
        n.type === "harvest" ||
        n.type.startsWith("stage_")
      );
    })
    .map((n) => {
      const type = n.type.includes("water") ? ("water" as const) : ("harvest" as const);
      return {
        id: `notif-${n.id}`,
        type,
        name: n.title,
        desc: n.body || undefined,
        source: "notification" as const,
        refId: n.id,
        icon: iconFor(type),
        color: colorFor(type),
      };
    });

  // 3) Plant-flag based tasks (fallback / legacy)
  const plantTasks: TaskItem[] = [
    ...plants
      .filter((p) => p.needs_watering)
      .filter((p) => !wateringTasks.some((w) => w.name === p.name))
      .map((p) => ({
        id: `water-${p.id}`,
        type: "water" as const,
        name: p.name,
        source: "plant" as const,
        refId: p.id,
        icon: Droplets,
        color: colorFor("water"),
      })),
    ...plants
      .filter((p) => (p.days_to_harvest ?? 30) <= 3)
      .map((p) => ({
        id: `harvest-${p.id}`,
        type: "harvest" as const,
        name: p.name,
        source: "plant" as const,
        refId: p.id,
        icon: Scissors,
        color: colorFor("harvest"),
      })),
    ...plants
      .filter((p) => {
        if (!p.planted_date) return false;
        const days = Math.floor((Date.now() - new Date(p.planted_date).getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 && days % 30 === 0;
      })
      .map((p) => ({
        id: `soil-${p.id}`,
        type: "soil" as const,
        name: p.name,
        source: "plant" as const,
        refId: p.id,
        icon: Leaf,
        color: colorFor("soil"),
      })),
  ];

  const todayTasks = [...wateringTasks, ...notificationTasks, ...plantTasks];
  const activeTasks = todayTasks.filter((task) => !completedTasks.some((c) => c.id === task.id));

  const persist = (list: TaskItem[]) => {
    setCompletedTasks(list);
    localStorage.setItem(
      "gardenPotCompletedTasks",
      JSON.stringify(list.map(({ icon, ...rest }) => rest))
    );
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["plants"] });
    queryClient.invalidateQueries({ queryKey: ["watering-events"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["unread-count"] });
  };

  const handleComplete = async (task: TaskItem) => {
    try {
      if (task.source === "event") await completeWateringEvent(task.refId);
      else if (task.source === "notification") await markAsRead(task.refId);
      else if (task.type === "water") await updatePlant(task.refId, { needs_watering: false });
    } catch {}
    refresh();
    persist([...completedTasks, task]);
    toast({ title: "✅", description: t("tasks.completed") });
  };

  const handleUndo = async (task: TaskItem) => {
    try {
      if (task.source === "event") await uncompleteWateringEvent(task.refId);
      else if (task.source === "notification") await markAsUnread(task.refId);
      else if (task.type === "water") await updatePlant(task.refId, { needs_watering: true });
    } catch {}
    refresh();
    persist(completedTasks.filter((c) => c.id !== task.id));
    toast({ title: "↩️", description: t("tasks.undone") });
  };

  return (
    <div className="pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground">{t("home.todaysTasks")}</h1>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {activeTasks.length === 0 ? (
          <div className="bg-card rounded-2xl p-6 border border-border text-center">
            <CheckCircle2 className="w-10 h-10 text-primary/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("home.noTasks")}</p>
          </div>
        ) : (
          activeTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-xl p-3 border border-border flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${task.color}`}>
                <task.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{task.name}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {task.desc
                    ? task.desc
                    : task.type === "water"
                    ? t("home.waterTask", { name: task.name })
                    : task.type === "harvest"
                    ? t("home.harvestTask", { name: task.name })
                    : t("home.soilTask", { name: task.name })}
                </p>
              </div>
              {task.source === "notification" && (
                <Bell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              )}
              <button
                onClick={() => handleComplete(task)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Completed tasks */}
      <div className="px-4 mt-5">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3"
        >
          <Clock className="w-4 h-4" /> {t("home.completedTasks")} ({completedTasks.length})
        </button>

        {showHistory && completedTasks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="bg-card/50 rounded-lg p-2.5 border border-border/40 flex items-center gap-2"
              >
                <task.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground flex-1 truncate">{task.name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <button onClick={() => handleUndo(task)} className="p-1 rounded hover:bg-secondary">
                  <Undo2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TasksPage;
