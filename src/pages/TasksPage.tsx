import { ArrowLeft, CheckCircle2, Undo2, Clock, Droplets, Scissors, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPlants, updatePlant } from "@/lib/plantService";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

interface TaskItem {
  id: string;
  type: "water" | "harvest" | "prune" | "soil";
  name: string;
  icon: React.ElementType;
  color: string;
}

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
        // Restore icons
        return parsed.map((t: any) => ({
          ...t,
          icon: t.type === "water" ? Droplets : t.type === "harvest" ? Scissors : Leaf,
          color: t.type === "water" ? "bg-blue-500/10 text-blue-500" : t.type === "harvest" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600",
        }));
      } catch { return []; }
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  const { data: plants = [] } = useQuery({
    queryKey: ["plants", user?.id],
    queryFn: () => fetchUserPlants(user!.id),
    enabled: !!user,
  });

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
      const days = Math.floor((Date.now() - new Date(p.planted_date).getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 && days % 30 === 0;
    }).map(p => ({
      id: `soil-${p.id}`, type: "soil" as const, name: p.name,
      icon: Leaf, color: "bg-amber-500/10 text-amber-600",
    })),
  ];

  const activeTasks = todayTasks.filter(t => !completedTasks.some(c => c.id === t.id));

  const handleComplete = async (task: TaskItem) => {
    if (task.type === "water") {
      const plantId = task.id.replace("water-", "");
      await updatePlant(plantId, { needs_watering: false });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
    }
    const updated = [...completedTasks, task];
    setCompletedTasks(updated);
    localStorage.setItem("gardenPotCompletedTasks", JSON.stringify(updated.map(({ icon, ...rest }) => rest)));
    toast({ title: "✅", description: t("tasks.completed") });
  };

  const handleUndo = async (task: TaskItem) => {
    if (task.type === "water") {
      const plantId = task.id.replace("water-", "");
      await updatePlant(plantId, { needs_watering: true });
      queryClient.invalidateQueries({ queryKey: ["plants"] });
    }
    const updated = completedTasks.filter(c => c.id !== task.id);
    setCompletedTasks(updated);
    localStorage.setItem("gardenPotCompletedTasks", JSON.stringify(updated.map(({ icon, ...rest }) => rest)));
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
          activeTasks.map(task => (
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
              <button onClick={() => handleComplete(task)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </button>
            </motion.div>
          ))
        )}
      </div>

      {/* Completed tasks */}
      <div className="px-4 mt-5">
        <button onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
          <Clock className="w-4 h-4" /> {t("home.completedTasks")} ({completedTasks.length})
        </button>

        {showHistory && completedTasks.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
            {completedTasks.map(task => (
              <div key={task.id} className="bg-card/50 rounded-lg p-2.5 border border-border/40 flex items-center gap-2">
                <task.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground flex-1">{task.name}</span>
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
