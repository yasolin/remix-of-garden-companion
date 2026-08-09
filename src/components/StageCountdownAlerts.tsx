import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CalendarClock, ChevronRight } from "lucide-react";
import type { PlantRow } from "@/lib/plantService";
import { getPlantStageInfo, labelOf, formatStageDate } from "@/lib/stageCountdown";
import { stageIcon } from "@/lib/stageIcons";

interface Props {
  plants: PlantRow[];
}

const StageCountdownAlerts = ({ plants }: Props) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language;

  const infos = useMemo(
    () =>
      plants
        .map((p) => getPlantStageInfo(p, lang))
        .filter((x): x is NonNullable<typeof x> => !!x),
    [plants, lang]
  );

  const [selectedId, setSelectedId] = useState<string | null>(
    () => localStorage.getItem("gardenPotStageAlertPlant")
  );

  useEffect(() => {
    if (infos.length && !infos.some((i) => i.plantId === selectedId)) {
      setSelectedId(infos[0].plantId);
    }
  }, [infos, selectedId]);

  useEffect(() => {
    if (selectedId) localStorage.setItem("gardenPotStageAlertPlant", selectedId);
  }, [selectedId]);

  const info = infos.find((i) => i.plantId === selectedId) ?? infos[0];
  if (!info) return null;

  const next = info.next;
  const daysLeft = next?.daysLeft ?? 0;
  const tone =
    !next
      ? "from-muted/40 to-card border-border"
      : daysLeft <= 1
      ? "from-emerald-500/15 to-card border-emerald-500/30"
      : daysLeft <= 7
      ? "from-amber-500/15 to-card border-amber-500/30"
      : "from-primary/10 to-card border-primary/20";

  return (
    <div className="px-4 mt-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <CalendarClock className="w-4 h-4 text-primary" />
          {t("stageAlerts.title")}
        </h3>
        <button
          onClick={() => navigate(`/plant/${info.plantId}`)}
          className="text-xs font-medium text-primary flex items-center gap-0.5"
        >
          {t("mainView.view")} <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Plant selector */}
      {infos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {infos.map((i) => (
            <button
              key={i.plantId}
              onClick={() => setSelectedId(i.plantId)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                i.plantId === info.plantId
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {i.plantName}
            </button>
          ))}
        </div>
      )}

      <motion.div
        key={info.plantId}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl border bg-gradient-to-br p-3 ${tone}`}
      >
        <div className="flex items-center gap-3">
          {(() => {
            const key = (next ?? info.current)?.stage.key ?? "planted";
            const Icon = stageIcon(key);
            return (
              <div className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" strokeWidth={2.2} />
              </div>
            );
          })()}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-muted-foreground">
              {info.current
                ? t("stageAlerts.currentStage", { stage: labelOf(info.current, lang) })
                : t("stageAlerts.notStarted")}
            </p>
            {next ? (
              <>
                <p className="text-sm font-bold text-foreground leading-tight">
                  {daysLeft <= 0
                    ? t("stageAlerts.stageToday", { stage: labelOf(next, lang) })
                    : t("stageAlerts.countdown", {
                        count: daysLeft,
                        stage: labelOf(next, lang),
                      })}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {info.plantName} • {formatStageDate(next.date, lang)}
                </p>
              </>
            ) : (
              <p className="text-sm font-bold text-foreground leading-tight">
                {t("stageAlerts.cycleComplete", { name: info.plantName })}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${info.progressPct}%` }}
          />
        </div>

        {/* Upcoming stages */}
        {info.upcoming.length > 1 && (
          <div className="flex gap-2 mt-3">
            {info.upcoming.slice(1).map((s) => {
              const Icon = stageIcon(s.stage.key);
              return (
              <div
                key={s.stage.key}
                className="flex-1 bg-card/70 rounded-xl px-2 py-1.5 border border-border/60 text-center"
              >
                <Icon className="w-4 h-4 mx-auto text-muted-foreground" strokeWidth={2.2} />
                <p className="text-[10px] font-medium text-foreground mt-0.5 truncate">
                  {labelOf(s, lang)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t("stageAlerts.inDays", { count: s.daysLeft })}
                </p>
              </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StageCountdownAlerts;
